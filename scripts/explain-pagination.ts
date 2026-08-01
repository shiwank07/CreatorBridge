import "dotenv/config";
import { MongoClient, ObjectId, type Document } from "mongodb";

const uri = process.env.ANALYTICS_TEST_MONGODB_URI;
if (!uri) throw new Error("ANALYTICS_TEST_MONGODB_URI is required; production fallback is intentionally disabled.");
const databaseName = process.env.MONGODB_DB_NAME?.trim() || "test";
if (!databaseName || /prod(uction)?/i.test(databaseName)) throw new Error("Use a named non-production test database.");

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const marker = `pagination-explain-${Date.now()}`;
  try {
  const db = client.db(databaseName);
  const creatorOwner = new ObjectId();
  const brandOwner = new ObjectId();
  const users = Array.from({ length: 150 }, (_, index) => ({
    _id: new ObjectId(), clerkId: `${marker}-${index}`, name: index % 11 === 0 ? `Needle ${index}` : `Synthetic ${index}`,
    username: `${marker}-${index}`, email: `${marker}-${index}@example.test`, role: index % 2 ? "brand" : "creator",
    onboardingComplete: true, accountStatus: index % 5 === 0 ? "suspended" : "active",
    createdAt: new Date(Date.now() - index * 60_000), updatedAt: new Date(Date.now() - index * 60_000),
  }));
  await db.collection("users").insertMany(users);
  await db.collection("creatorprofiles").insertMany(users.filter((user) => user.role === "creator").map((user, index) => ({
    userId: user._id, verificationStatus: index % 3 === 0 ? "pending" : "verified",
    youtubeHandle: index % 11 === 0 ? `needle-${index}` : `handle-${index}`, createdAt: user.createdAt, updatedAt: user.updatedAt, explainMarker: marker,
  })));
  await db.collection("brandprofiles").insertMany(users.filter((user) => user.role === "brand").map((user, index) => ({
    userId: user._id, companyName: index % 11 === 0 ? `Needle Brand ${index}` : `Brand ${index}`,
    contactName: user.name, contactEmail: user.email, industry: "Test", verificationStatus: index % 3 === 0 ? "pending" : "verified",
    createdAt: user.createdAt, updatedAt: user.updatedAt, explainMarker: marker,
  })));
  await db.collection("brandinquiries").insertMany(Array.from({ length: 150 }, (_, index) => ({
    seedKey: `${marker}-${index}`, companyName: index % 11 === 0 ? `Needle Collaboration ${index}` : `Company ${index}`,
    creatorUserId: creatorOwner, brandUserId: brandOwner, status: index % 3 === 0 ? "ACCEPTED" : "NEW",
    createdAt: new Date(Date.now() - index * 60_000), updatedAt: new Date(Date.now() - index * 60_000),
  })));
  await db.collection("emailnotifications").insertMany(Array.from({ length: 150 }, (_, index) => ({
    recipient: index % 11 === 0 ? `needle-${index}@example.test` : `${marker}-${index}@example.test`,
    event: index % 2 ? "verification_event" : "collaboration_event", status: index % 3 === 0 ? "failed" : "sent",
    providerId: `${marker}-${index}`, createdAt: new Date(Date.now() - index * 60_000),
  })));
  const cases: { name: string; collection: string; filter: Document; sort: Document }[] = [
    { name: "creator search plus verification", collection: "creatorprofiles", filter: { verificationStatus: "pending", youtubeHandle: /needle/i }, sort: { updatedAt: -1, _id: -1 } },
    { name: "brand search plus verification", collection: "brandprofiles", filter: { verificationStatus: "pending", companyName: /needle/i }, sort: { updatedAt: -1, _id: -1 } },
    { name: "user name search plus role", collection: "users", filter: { role: "creator", name: /needle/i }, sort: { createdAt: -1, _id: -1 } },
    { name: "collaboration status search", collection: "brandinquiries", filter: { status: "ACCEPTED", companyName: /needle/i }, sort: { updatedAt: -1, _id: -1 } },
    { name: "contact status search", collection: "users", filter: { role: "brand", accountStatus: "active", name: /needle/i }, sort: { updatedAt: -1, _id: -1 } },
    { name: "failed email recipient search", collection: "emailnotifications", filter: { status: "failed", recipient: /needle/i }, sort: { createdAt: -1, _id: -1 } },
    { name: "email event filter", collection: "emailnotifications", filter: { event: "verification_event" }, sort: { createdAt: -1, _id: -1 } },
    { name: "creator history", collection: "brandinquiries", filter: { creatorUserId: creatorOwner }, sort: { createdAt: -1, _id: -1 } },
    { name: "brand history", collection: "brandinquiries", filter: { brandUserId: brandOwner }, sort: { createdAt: -1, _id: -1 } },
  ];
  for (const item of cases) {
    const result = await db.collection(item.collection).find(item.filter).sort(item.sort).limit(30).explain("executionStats");
    const stats = result.executionStats;
    const plan = JSON.stringify(result.queryPlanner?.winningPlan ?? {});
    const index = plan.match(/"indexName":"([^"]+)"/)?.[1] ?? (plan.includes("COLLSCAN") ? "COLLSCAN" : "not reported");
    console.log(JSON.stringify({
      query: item.name,
      index,
      keysExamined: stats?.totalKeysExamined ?? 0,
      documentsExamined: stats?.totalDocsExamined ?? 0,
      returned: stats?.nReturned ?? 0,
      executionTimeMs: stats?.executionTimeMillis ?? 0,
      collectionScan: plan.includes("COLLSCAN"),
    }));
  }
  } finally {
    const db = client.db(databaseName);
    await Promise.all([
      db.collection("users").deleteMany({ clerkId: { $regex: `^${marker}` } }),
      db.collection("creatorprofiles").deleteMany({ explainMarker: marker }),
      db.collection("brandprofiles").deleteMany({ explainMarker: marker }),
      db.collection("brandinquiries").deleteMany({ seedKey: { $regex: `^${marker}` } }),
      db.collection("emailnotifications").deleteMany({ providerId: { $regex: `^${marker}` } }),
    ]);
    await client.close();
  }
}

void main();
