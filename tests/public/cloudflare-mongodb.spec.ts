import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { connectMongoose, MongoTemporaryUnavailableError, waitForMongoState } from "../../lib/db";
import { settleHomepageData } from "../../lib/queries/public";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("a request arriving during readyState 2 waits locally and succeeds", async () => {
  let sleeps = 0;
  const fake = {
    connection: { readyState: 2 },
    connect: async () => { throw new Error("must not reconnect"); },
    disconnect: async () => { fake.connection.readyState = 0; },
  };
  await expect(connectMongoose(fake as never, "mongodb://example/test", undefined, { sleep: async () => { sleeps += 1; fake.connection.readyState = 1; } })).resolves.toBe(fake);
  expect(sleeps).toBe(1);
});

test("state waiting uses only local polling and has a strict deadline", async () => {
  let clock = 0;
  const fake = { connection: { readyState: 2 }, connect: async () => fake, disconnect: async () => undefined };
  await expect(waitForMongoState(fake as never, { timeoutMs: 100, now: () => clock, sleep: async (ms) => { clock += ms; } })).rejects.toBeInstanceOf(MongoTemporaryUnavailableError);
  expect(clock).toBe(100);
  const source = fs.readFileSync(path.join(process.cwd(), "lib/db.ts"), "utf8");
  expect(source).not.toMatch(/connectionPromise|cache\.promise|await\s+client\.connection/);
});

test("a state 2 to 0 transition permits one clean connection attempt", async () => {
  let connects = 0;
  const fake = { connection: { readyState: 2 }, connect: async () => { connects += 1; fake.connection.readyState = 1; return fake; }, disconnect: async () => undefined };
  await expect(connectMongoose(fake as never, "mongodb://example/test", undefined, { sleep: async () => { fake.connection.readyState = 0; } })).resolves.toBe(fake);
  expect(connects).toBe(1);
});

test("concurrent callers trigger only one mongoose.connect call", async () => {
  const pending = deferred<unknown>();
  let connects = 0;
  const fake = {
    connection: { readyState: 0 },
    connect: async () => { connects += 1; fake.connection.readyState = 2; await pending.promise; fake.connection.readyState = 1; return fake; },
    disconnect: async () => { fake.connection.readyState = 0; },
  };
  const first = connectMongoose(fake as never, "mongodb://example/test");
  const second = connectMongoose(fake as never, "mongodb://example/test", undefined, { sleep: async () => { pending.resolve(fake); await Promise.resolve(); } });
  await Promise.all([first, second]);
  expect(connects).toBe(1);
});

test("failed connection resets transitional state for a later retry", async () => {
  let disconnects = 0;
  const fake = {
    connection: { readyState: 0 },
    connect: async () => { fake.connection.readyState = 2; throw new Error("selection failed"); },
    disconnect: async () => { disconnects += 1; fake.connection.readyState = 0; },
  };
  await expect(connectMongoose(fake as never, "mongodb://example/test")).rejects.toThrow("selection failed");
  expect(fake.connection.readyState).toBe(0);
  expect(disconnects).toBe(1);
});

test("homepage data failures preserve a renderable fallback", async () => {
  const data = await settleHomepageData({ creators: async () => { throw new Error("db"); }, brands: async () => [], stats: async () => { throw new Error("db"); } });
  expect(data).toEqual({ featuredCreators: [], featuredBrands: [], stats: { creators: 0, brands: 0, collaborations: 0 } });
});

test("public creator queries have finite database execution limits", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/queries/creators.ts"), "utf8");
  expect(source).toContain("MONGO_QUERY_TIMEOUT_MS");
  expect(source).toContain("maxTimeMS");
});

test("database health route always has finite success and failure responses", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/health/db/route.ts"), "utf8");
  expect(route).toContain("if (!hasMongoUri())");
  expect(route).toContain('status: "connecting"');
  expect(route).toContain('reason: "configuration"');
  expect(route).toContain('status: "unavailable"');
  expect(route).toContain("await verifyDBConnection()");
  expect(route).toContain("catch");
});

test("onboarding maps busy state to an accurate retryable message", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/onboarding/page.tsx"), "utf8");
  const errors = fs.readFileSync(path.join(process.cwd(), "lib/api-errors.ts"), "utf8");
  expect(page).toContain("Branzzo is connecting to the database. Please retry in a moment.");
  expect(page).not.toContain("MongoDB Atlas is not reachable");
  expect(errors).toContain('code: "DATABASE_CONNECTING"');
});

test("no unresolved Mongoose promise cache remains", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/db.ts"), "utf8");
  expect(source).not.toContain("mongooseCache");
  expect(source).not.toContain("cache.promise");
  expect(source).not.toMatch(/globalForMongoose|globalThis\s+as/);
  expect(source).toContain("bufferCommands: false");
  expect(source).toContain("serverSelectionTimeoutMS");
});
