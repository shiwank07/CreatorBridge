import { config } from "dotenv";

import { connectDB } from "../lib/db";
import { BrandInquiry } from "../lib/models/BrandInquiry";
import { InAppNotification } from "../lib/models/InAppNotification";

config({ path: ".env.local" });
config();

const apply = process.argv.includes("--apply");

const collaborationIndexes: Array<{ key: Record<string, 1 | -1>; name: string }> = [
  { key: { createdAt: -1 }, name: "analytics_createdAt" },
  { key: { firstCreatorViewedAt: -1 }, name: "analytics_firstCreatorViewedAt" },
  { key: { firstCreatorResponseAt: -1 }, name: "analytics_firstCreatorResponseAt" },
  { key: { acceptedAt: -1 }, name: "analytics_acceptedAt" },
  { key: { rejectedAt: -1 }, name: "analytics_rejectedAt" },
  { key: { cancelledAt: -1 }, name: "analytics_cancelledAt" },
  { key: { proofSubmittedAt: -1 }, name: "analytics_proofSubmittedAt" },
  { key: { completedAt: -1 }, name: "analytics_completedAt" },
  { key: { brandUserId: 1, createdAt: -1 }, name: "analytics_brandUser_createdAt" },
  { key: { brandProfileId: 1, createdAt: -1 }, name: "analytics_brandProfile_createdAt" },
  { key: { createdByClerkId: 1, createdAt: -1 }, name: "analytics_brandClerk_createdAt" },
  { key: { creatorUserId: 1, createdAt: -1 }, name: "analytics_creatorUser_createdAt" },
  { key: { creatorProfileId: 1, createdAt: -1 }, name: "analytics_creatorProfile_createdAt" },
  { key: { brandUserId: 1, status: 1, deadline: 1 }, name: "analytics_brandUser_status_deadline" },
  { key: { brandProfileId: 1, status: 1, deadline: 1 }, name: "analytics_brandProfile_status_deadline" },
  { key: { createdByClerkId: 1, status: 1, deadline: 1 }, name: "analytics_brandClerk_status_deadline" },
  { key: { creatorUserId: 1, status: 1, deadline: 1 }, name: "analytics_creatorUser_status_deadline" },
  { key: { creatorProfileId: 1, status: 1, deadline: 1 }, name: "analytics_creatorProfile_status_deadline" },
  { key: { status: 1, lastMeaningfulActivityAt: 1 }, name: "analytics_status_activity" },
];

async function ensureIndexes(collectionName: string, collection: typeof BrandInquiry.collection, definitions: typeof collaborationIndexes) {
  const existingIndexes = await collection.listIndexes().toArray();
  const existingNames = new Set(existingIndexes.map((index) => index.name));
  const existingKeys = new Set(existingIndexes.map((index) => JSON.stringify(index.key)));
  const results: Array<{ name: string; status: "created" | "already_existing" | "missing" | "failed"; error?: string }> = [];
  for (const definition of definitions) {
    if (existingNames.has(definition.name) || existingKeys.has(JSON.stringify(definition.key))) {
      results.push({ name: definition.name, status: "already_existing" });
      continue;
    }
    try {
      if (apply) {
        await collection.createIndex(definition.key, { name: definition.name, background: true });
        results.push({ name: definition.name, status: "created" });
      } else {
        results.push({ name: definition.name, status: "missing" });
      }
    } catch {
      results.push({ name: definition.name, status: "failed", error: "Index operation failed; inspect protected database logs." });
    }
  }
  return { collection: collectionName, results };
}

async function run() {
  await connectDB();
  const reports = await Promise.all([
    ensureIndexes("brandinquiries", BrandInquiry.collection, collaborationIndexes),
    ensureIndexes("inappnotifications", InAppNotification.collection as typeof BrandInquiry.collection, [{ key: { createdAt: -1 }, name: "analytics_createdAt" }]),
  ]);
  process.stdout.write(`${JSON.stringify({ mode: apply ? "apply" : "verify", destructive: false, droppedIndexes: 0, reports }, null, 2)}\n`);
}

run().then(() => process.exit(0)).catch(() => {
  process.stderr.write("Analytics index operation failed. Inspect protected database logs.\n");
  process.exit(1);
});
