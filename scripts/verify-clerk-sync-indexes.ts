import "dotenv/config";
import mongoose from "mongoose";

import { ClerkWebhookEvent } from "../lib/models/ClerkWebhookEvent";
import { User } from "../lib/models/User";

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  const duplicateEvents = await ClerkWebhookEvent.aggregate([
    { $group: { _id: "$eventId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }, { $limit: 10 },
  ]);
  const duplicateClerkUsers = await User.aggregate([
    { $group: { _id: "$clerkId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }, { $limit: 10 },
  ]);
  if (duplicateEvents.length || duplicateClerkUsers.length) {
    throw new Error(`Blocked: ${duplicateEvents.length} duplicate Clerk event IDs and ${duplicateClerkUsers.length} duplicate Clerk user IDs found.`);
  }
  const [eventIndexes, userIndexes] = await Promise.all([
    ClerkWebhookEvent.collection.indexes().catch(() => []),
    User.collection.indexes(),
  ]);
  console.log(`Clerk sync index dry run passed. Event indexes=${eventIndexes.length}; user indexes=${userIndexes.length}; no indexes changed.`);
}
main().finally(() => mongoose.disconnect());
