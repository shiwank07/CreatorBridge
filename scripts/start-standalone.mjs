import path from "node:path";
import { pathToFileURL } from "node:url";

const portArg = process.argv.find((value) => value.startsWith("--port="));
const separatePortIndex = process.argv.indexOf("--port");
const requestedPort = portArg?.slice("--port=".length) ||
  (separatePortIndex >= 0 ? process.argv[separatePortIndex + 1] : "") ||
  process.env.PORT || "3000";
if (!/^\d{2,5}$/.test(requestedPort)) throw new Error("A valid E2E server port is required.");
process.env.PORT = requestedPort;
process.env.HOSTNAME = process.env.E2E_HOSTNAME || "127.0.0.1";
await import(pathToFileURL(path.resolve(".next/standalone/server.js")).href);
