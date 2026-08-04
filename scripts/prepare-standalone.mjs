import { cp, mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const serverPath = path.join(standaloneRoot, "server.js");

async function requireFile(filePath, label) {
  try {
    if ((await stat(filePath)).isFile()) return;
  } catch {}
  throw new Error(`${label} is missing at ${path.relative(projectRoot, filePath)}.`);
}

async function requireDirectory(directoryPath, label) {
  try {
    if ((await stat(directoryPath)).isDirectory()) return;
  } catch {}
  throw new Error(`${label} is missing at ${path.relative(projectRoot, directoryPath)}.`);
}

async function replaceDirectory(source, destination) {
  const staging = `${destination}.prepare-${process.pid}`;
  await mkdir(path.dirname(destination), { recursive: true });
  await rm(staging, { recursive: true, force: true });

  try {
    await cp(source, staging, { recursive: true });
    await rm(destination, { recursive: true, force: true });
    await rename(staging, destination);
  } catch (error) {
    await rm(staging, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
}

const publicSource = path.join(projectRoot, "public");
const staticSource = path.join(projectRoot, ".next", "static");
const publicDestination = path.join(standaloneRoot, "public");
const staticDestination = path.join(standaloneRoot, ".next", "static");

await requireFile(serverPath, "Standalone Next.js server");
await requireDirectory(publicSource, "Public asset source");
await requireDirectory(staticSource, "Next.js static asset source");
await replaceDirectory(publicSource, publicDestination);
await replaceDirectory(staticSource, staticDestination);

console.info("Prepared standalone public and Next.js static assets.");
