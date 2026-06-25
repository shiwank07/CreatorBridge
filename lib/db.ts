import mongoose, { type ConnectOptions } from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose.mongooseCache = cache;

export function hasMongoUri() {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export async function connectDB() {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const options: ConnectOptions = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    ...(process.env.MONGODB_DB_NAME ? { dbName: process.env.MONGODB_DB_NAME } : {}),
  };

  cache.promise ??= mongoose.connect(uri, options).catch((error) => {
    cache.promise = null;
    throw error;
  });

  cache.conn = await cache.promise;
  return cache.conn;
}

export async function disconnectDB() {
  cache.conn = null;
  cache.promise = null;
  await mongoose.disconnect();
}

export function getMongoReadyState() {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] ?? "unknown";
}

export async function verifyDBConnection() {
  const db = await connectDB();
  const connection = db.connection;

  if (!connection.db) {
    throw new Error("MongoDB connection is not ready.");
  }

  await connection.db.admin().ping();

  return {
    ok: true,
    database: connection.name,
    host: connection.host,
    readyState: getMongoReadyState(),
  };
}
