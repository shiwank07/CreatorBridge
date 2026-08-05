import mongoose, { type Connection, type ConnectOptions, type Model } from "mongoose";
import { withServerTiming } from "@/lib/server-timing";

// Account routing runs during Atlas cold starts as well as steady state. A 1.5s
// deadline was short enough to misclassify healthy, completed accounts.
export const MONGO_CONNECTION_TIMEOUT_MS = 5_000;
export const MONGO_QUERY_TIMEOUT_MS = 5_000;

type MongooseClient = Pick<typeof mongoose, "connect" | "disconnect" | "connection">;

export type MongoConnectionCache = {
  connection: MongooseClient | null;
  promise: Promise<MongooseClient> | null;
};

declare global {
  var mongooseConnectionCache: MongoConnectionCache | undefined;
}

const mongooseCache = globalThis.mongooseConnectionCache ??= { connection: null, promise: null };

mongoose.set("bufferCommands", false);

export class MongoConfigurationError extends Error {
  constructor() { super("MONGODB_URI is not configured."); this.name = "MongoConfigurationError"; }
}

export class MongoTemporaryUnavailableError extends Error {
  reason: "connecting" | "disconnecting" | "timeout" | "pool_checkout" | "request_contention";
  constructor(reason: "connecting" | "disconnecting" | "timeout" | "pool_checkout" | "request_contention") {
    super(`MongoDB is temporarily unavailable (${reason}).`);
    this.name = "MongoTemporaryUnavailableError";
    this.reason = reason;
  }
}

export type MongoFailureKind = "configuration" | "connecting" | "authentication" | "network" | "unavailable";

export function classifyMongoError(error: unknown): MongoFailureKind {
  if (error instanceof MongoConfigurationError || (error instanceof Error && error.message.includes("MONGODB_URI"))) return "configuration";
  if (error instanceof MongoTemporaryUnavailableError) return "connecting";
  const record = typeof error === "object" && error ? error as Record<string, unknown> : {};
  const name = typeof record.name === "string" ? record.name : "";
  const code = typeof record.code === "number" ? record.code : undefined;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (code === 18 || message.includes("authentication failed") || message.includes("bad auth")) return "authentication";
  if (/Mongo(Network|ServerSelection|Parse|WaitQueueTimeout)|MongooseServerSelection/.test(name) || /enotfound|econnrefused|etimeout|server selection|wait queue|timed out while checking out|dns/.test(message)) return "network";
  return "unavailable";
}

function safeMongoLog(input: {
  operation: string; readyState: number; startedAt: number; error?: unknown; retryable: boolean; phase: string;
}) {
  const errorClass = input.error instanceof Error ? input.error.name : input.error ? "UnknownError" : "none";
  const payload = {
    operation: input.operation,
    readyState: input.readyState,
    durationMs: Math.round(performance.now() - input.startedAt),
    errorClass,
    retryable: input.retryable,
    phase: input.phase,
  };
  if (input.error) console.error("[mongodb-request]", payload);
  else console.info("[mongodb-request]", payload);
}

export function modelForConnection<T>(connection: Connection, model: Model<T>): Model<T> {
  return (connection.models[model.modelName] as Model<T> | undefined) ?? connection.model<T>(model.modelName, model.schema);
}

function connectionOptions(dbName?: string): ConnectOptions {
  return {
    bufferCommands: false,
    maxPoolSize: 5,
    maxConnecting: 1,
    minPoolSize: 0,
    waitQueueTimeoutMS: MONGO_QUERY_TIMEOUT_MS,
    serverSelectionTimeoutMS: MONGO_CONNECTION_TIMEOUT_MS,
    connectTimeoutMS: MONGO_CONNECTION_TIMEOUT_MS,
    socketTimeoutMS: 10_000,
    ...(dbName ? { dbName } : {}),
  };
}

export async function connectMongoose(
  client: MongooseClient,
  uri: string,
  dbName?: string,
  cache: MongoConnectionCache = mongooseCache,
): Promise<MongooseClient> {
  if (cache.connection?.connection.readyState === 1) return cache.connection;
  if (client.connection.readyState === 1) {
    cache.connection = client;
    return client;
  }
  cache.connection = null;

  if (!cache.promise) {
    cache.promise = client.connect(uri, connectionOptions(dbName))
      .then((connected) => {
        cache.connection = connected;
        cache.promise = null;
        return connected;
      })
      .catch((error) => {
        cache.connection = null;
        cache.promise = null;
        throw error;
      });
  }

  return cache.promise;
}

export async function withMongoRequest<T>(
  operation: string,
  callback: (connection: Connection) => Promise<T>,
  options: { client?: MongooseClient; cache?: MongoConnectionCache } = {},
): Promise<T> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new MongoConfigurationError();
  const startedAt = performance.now();
  const client = options.client ?? mongoose;

  try {
    const connected = await connectMongoose(client, uri, process.env.MONGODB_DB_NAME?.trim(), options.cache ?? mongooseCache);
    safeMongoLog({ operation, readyState: connected.connection.readyState, startedAt, retryable: false, phase: "connected" });
    return await callback(connected.connection);
  } catch (error) {
    const record = typeof error === "object" && error ? error as Record<string, unknown> : {};
    const errorName = typeof record.name === "string" ? record.name : "";
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const classified = errorName.includes("WaitQueueTimeout") || message.includes("checking out") || message.includes("wait queue")
      ? new MongoTemporaryUnavailableError("pool_checkout")
      : error;
    safeMongoLog({ operation, readyState: client.connection.readyState, startedAt, error: classified, retryable: classifyMongoError(classified) !== "authentication", phase: client.connection.readyState === 2 ? "connect" : "operation" });
    throw classified;
  }
}

export function hasMongoUri() { return Boolean(process.env.MONGODB_URI?.trim()); }

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new MongoConfigurationError();
  return withServerTiming("connectDB", () => connectMongoose(mongoose, uri, process.env.MONGODB_DB_NAME?.trim()), {
    readyState: mongoose.connection.readyState,
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
  mongooseCache.connection = null;
  mongooseCache.promise = null;
}

export function getMongoReadyState() {
  const states: Record<number, string> = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  return states[mongoose.connection.readyState] ?? "unknown";
}

export async function verifyDBConnection() {
  const db = await connectDB();
  if (!db.connection.db) throw new MongoTemporaryUnavailableError("connecting");
  await db.connection.db.admin().command({ ping: 1, maxTimeMS: MONGO_QUERY_TIMEOUT_MS });
  return { ok: true, database: db.connection.name, host: db.connection.host, readyState: getMongoReadyState() };
}
