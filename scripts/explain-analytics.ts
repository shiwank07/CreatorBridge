import { config } from "dotenv";

import { connectDB } from "../lib/db";
import { BrandInquiry } from "../lib/models/BrandInquiry";
import { InAppNotification } from "../lib/models/InAppNotification";

config({ path: ".env.local" });
config();

function summarize(name: string, explain: Record<string, unknown>, cardinality: number) {
  const execution = explain.executionStats as { nReturned?: number; totalDocsExamined?: number; totalKeysExamined?: number; executionTimeMillis?: number; executionStages?: { stage?: string; indexName?: string; inputStage?: { stage?: string; indexName?: string } } } | undefined;
  const planner = explain.queryPlanner as { winningPlan?: unknown } | undefined;
  return {
    name,
    collectionCardinality: cardinality,
    winningPlan: planner?.winningPlan ?? execution?.executionStages,
    indexUsed: execution?.executionStages?.indexName ?? execution?.executionStages?.inputStage?.indexName ?? "inspect winningPlan",
    returned: execution?.nReturned,
    docsExamined: execution?.totalDocsExamined,
    keysExamined: execution?.totalKeysExamined,
    executionTimeMs: execution?.executionTimeMillis,
  };
}

async function run() {
  await connectDB();
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 86_400_000);
  const sample = await BrandInquiry.findOne({ brandUserId: { $ne: null }, creatorUserId: { $ne: null } }).select("brandUserId creatorUserId").lean();
  const [collaborationCount, notificationCount] = await Promise.all([BrandInquiry.estimatedDocumentCount(), InAppNotification.estimatedDocumentCount()]);
  const queries = [
    ["creator-created", BrandInquiry.find({ creatorUserId: sample?.creatorUserId, createdAt: { $gte: start, $lt: now } }).explain("executionStats"), collaborationCount],
    ["brand-created", BrandInquiry.find({ brandUserId: sample?.brandUserId, createdAt: { $gte: start, $lt: now } }).explain("executionStats"), collaborationCount],
    ["admin-completed", BrandInquiry.find({ completedAt: { $gte: start, $lt: now } }).explain("executionStats"), collaborationCount],
    ["notification-period", InAppNotification.find({ createdAt: { $gte: start, $lt: now } }).explain("executionStats"), notificationCount],
    ["creator-deadline", BrandInquiry.find({ creatorUserId: sample?.creatorUserId, status: { $in: ["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED"] }, deadline: { $gte: now } }).explain("executionStats"), collaborationCount],
  ] as const;
  const results = [];
  for (const [name, work, cardinality] of queries) results.push(summarize(name, await work as unknown as Record<string, unknown>, cardinality));
  process.stdout.write(`${JSON.stringify({ generatedAt: now.toISOString(), results }, null, 2)}\n`);
}

run().then(() => process.exit(0)).catch(() => {
  process.stderr.write("Analytics explain-plan capture failed. Inspect protected database logs.\n");
  process.exit(1);
});
