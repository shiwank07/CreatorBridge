import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { disconnectDB, verifyDBConnection } from "../lib/db";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    process.env[key] ??= value;
  }
}

async function checkDB() {
  loadLocalEnv();

  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error("MONGODB_URI is empty. Add your MongoDB Atlas connection string to .env.local.");
  }

  const status = await verifyDBConnection();
  console.log(`MongoDB connected: ${status.database} (${status.readyState})`);
}

checkDB()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
