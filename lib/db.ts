import mongoose, { type ConnectOptions } from "mongoose";
import { withServerTiming } from "@/lib/server-timing";

export const MONGO_CONNECTION_TIMEOUT_MS = 5_000;
export const MONGO_QUERY_TIMEOUT_MS = 4_000;
export const MONGO_STATE_POLL_MS = 40;

type MongooseClient = Pick<typeof mongoose, "connect" | "disconnect" | "connection">;
type WaitOptions = { timeoutMs?: number; pollMs?: number; now?: () => number; sleep?: (ms: number) => Promise<void> };

mongoose.set("bufferCommands", false);

export class MongoConfigurationError extends Error {
  constructor() { super("MONGODB_URI is not configured."); this.name = "MongoConfigurationError"; }
}

export class MongoTemporaryUnavailableError extends Error {
  reason: "connecting" | "disconnecting" | "timeout";
  constructor(reason: "connecting" | "disconnecting" | "timeout") {
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
  if (/Mongo(Network|ServerSelection|Parse)|MongooseServerSelection/.test(name) || /enotfound|econnrefused|etimeout|server selection|dns/.test(message)) return "network";
  return "unavailable";
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
    maxPoolSize: 5,
    minPoolSize: 0,
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
