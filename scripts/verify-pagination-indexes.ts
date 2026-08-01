import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.ANALYTICS_TEST_MONGODB_URI ?? process.env.MONGODB_URI;
if (!uri) throw new Error("Set ANALYTICS_TEST_MONGODB_URI or MONGODB_URI.");

const apply = process.argv.includes("--apply");
const confirmProduction = process.argv.includes("--confirm-production");
const databaseName = process.env.MONGODB_DB_NAME?.trim() || "test";
if (/prod(uction)?/i.test(databaseName) && !confirmProduction) {
  throw new Error("Refusing to inspect a production-named database without --confirm-production.");
}

const required = [
  { collection: "users", name: "role_1_accountStatus_1_createdAt_-1__id_-1", key: { role: 1, accountStatus: 1, createdAt: -1, _id: -1 } },
  { collection: "creatorprofiles", name: "verificationStatus_1_updatedAt_-1__id_-1", key: { verificationStatus: 1, updatedAt: -1, _id: -1 } },
  { collection: "brandprofiles", name: "verificationStatus_1_updatedAt_-1__id_-1", key: { verificationStatus: 1, updatedAt: -1, _id: -1 } },
  { collection: "brandinquiries", name: "status_1_createdAt_-1__id_-1", key: { status: 1, createdAt: -1, _id: -1 } },
  { collection: "emailnotifications", name: "status_1_createdAt_-1__id_-1", key: { status: 1, createdAt: -1, _id: -1 } },
  { collection: "emailnotifications", name: "event_1_createdAt_-1__id_-1", key: { event: 1, createdAt: -1, _id: -1 } },
] as const;

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  try {
  const db = client.db(databaseName);
  for (const item of required) {
    const collection = db.collection(item.collection);
    const existing = await collection.indexes().catch(() => []);
    const found = existing.some((index) => JSON.stringify(index.key) === JSON.stringify(item.key));
    if (found) {
      console.log(`${item.collection}: ${item.name}: existing`);
    } else if (!apply) {
      console.log(`${item.collection}: ${item.name}: missing`);
    } else {
      await collection.createIndex(item.key, { name: item.name });
      console.log(`${item.collection}: ${item.name}: created`);
    }
  }
  } finally {
    await client.close();
  }
}

void main();
