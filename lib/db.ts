import mongoose, { type Connection, type ConnectOptions, type Model } from "mongoose";
import { withServerTiming } from "@/lib/server-timing";

// Account routing runs during Atlas cold starts as well as steady state. A 1.5s
// deadline was short enough to misclassify healthy, completed accounts.
export const MONGO_CONNECTION_TIMEOUT_MS = 5_000;
export const MONGO_QUERY_TIMEOUT_MS = 5_000;
export const MONGO_STATE_POLL_MS = 40;

type MongooseClient = Pick<typeof mongoose, "connect" | "disconnect" | "connection">;
type WaitOptions = { timeoutMs?: number; pollMs?: number; now?: () => number; sleep?: (ms: number) => Promise<void> };

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

type RequestConnectionFactory = (uri: string, options: ConnectOptions) => Connection;

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

export async function withMongoRequest<T>(
  operation: string,
  callback: (connection: Connection) => Promise<T>,
  options: { createConnection?: RequestConnectionFactory } = {},
): Promise<T> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new MongoConfigurationError();
  const startedAt = performance.now();
  const connectionOptions: ConnectOptions = {
    bufferCommands: false,
    maxPoolSize: 1,
    maxConnecting: 1,
    minPoolSize: 0,
    waitQueueTimeoutMS: MONGO_QUERY_TIMEOUT_MS,
    serverMonitoringMode: "poll",
    serverSelectionTimeoutMS: MONGO_CONNECTION_TIMEOUT_MS,
    connectTimeoutMS: MONGO_CONNECTION_TIMEOUT_MS,
    socketTimeoutMS: 10_000,
    ...(process.env.MONGODB_DB_NAME?.trim() ? { dbName: process.env.MONGODB_DB_NAME.trim() } : {}),
  };
  const connection = (options.createConnection ?? ((requestUri, requestOptions) => mongoose.createConnection(requestUri, requestOptions)))(uri, connectionOptions);
  try {
    await connection.asPromise();
    safeMongoLog({ operation, readyState: connection.readyState, startedAt, retryable: false, phase: "connected" });
    return await callback(connection);
  } catch (error) {
    const record = typeof error === "object" && error ? error as Record<string, unknown> : {};
    const errorName = typeof record.name === "string" ? record.name : "";
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const classified = errorName.includes("WaitQueueTimeout") || message.includes("checking out") || message.includes("wait queue")
      ? new MongoTemporaryUnavailableError("pool_checkout")
      : error;
    safeMongoLog({ operation, readyState: connection.readyState, startedAt, error: classified, retryable: classifyMongoError(classified) !== "authentication", phase: connection.readyState === 2 ? "connect" : "operation" });
    throw classified;
  } finally {
    try {
      await connection.destroy(true);
      safeMongoLog({ operation, readyState: connection.readyState, startedAt, retryable: false, phase: "destroyed" });
    } catch (error) {
      safeMongoLog({ operation, readyState: connection.readyState, startedAt, error, retryable: true, phase: "destroy" });
    }
  }
}

export function hasMongoUri() { return Boolean(process.env.MONGODB_URI?.trim()); }

const localSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Waits only on this request's timers and reads readyState; it never touches the other request's promise. */
export async function waitForMongoState(client: MongooseClient, options: WaitOptions = {}) {
  const timeoutMs = Math.min(options.timeoutMs ?? MONGO_CONNECTION_TIMEOUT_MS, MONGO_CONNECTION_TIMEOUT_MS);
  const pollMs = Math.max(25, Math.min(options.pollMs ?? MONGO_STATE_POLL_MS, 50));
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? localSleep;
  const deadline = now() + timeoutMs;

  while (now() < deadline) {
    const state = client.connection.readyState;
    if (state === 1 || state === 0) return state;
    await sleep(Math.min(pollMs, Math.max(0, deadline - now())));
  }
  const finalState = client.connection.readyState;
  if (finalState === 1 || finalState === 0) return finalState;
  throw new MongoTemporaryUnavailableError("timeout");
}

export async function connectMongoose(client: MongooseClient, uri: string, dbName?: string, waitOptions: WaitOptions = {}) {
  let state: number = client.connection.readyState;
  if (state === 1) return client;
  if (state === 2 || state === 3) state = await waitForMongoState(client, waitOptions);
  if (state === 1) return client;
  if (state !== 0) throw new MongoTemporaryUnavailableError(state === 3 ? "disconnecting" : "connecting");

  const options: ConnectOptions = {
    bufferCommands: false,
    maxPoolSize: 2,
    maxConnecting: 1,
    minPoolSize: 0,
    maxIdleTimeMS: 30_000,
    waitQueueTimeoutMS: MONGO_QUERY_TIMEOUT_MS,
    serverMonitoringMode: "poll",
    serverSelectionTimeoutMS: MONGO_CONNECTION_TIMEOUT_MS,
    connectTimeoutMS: MONGO_CONNECTION_TIMEOUT_MS,
    socketTimeoutMS: 10_000,
    ...(dbName ? { dbName } : {}),
  };

  try {
    // Mongoose changes readyState synchronously when connect() begins. Later
    // requests therefore poll state instead of starting another connect call.
    return await client.connect(uri, options);
  } catch (error) {
    if (client.connection.readyState !== 0) await client.disconnect().catch(() => undefined);
    throw error;
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new MongoConfigurationError();
  return withServerTiming("connectDB", () => connectMongoose(mongoose, uri, process.env.MONGODB_DB_NAME?.trim()), {
    readyState: mongoose.connection.readyState,
  });
}

export async function disconnectDB() { await mongoose.disconnect(); }

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
