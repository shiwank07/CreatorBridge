import "dotenv/config";
import mongoose from "mongoose";
import { EmailNotification } from "../lib/models/EmailNotification";

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(uri);
  const duplicateDeliveryKeys = await EmailNotification.aggregate([
    { $match: { deliveryKey: { $type: "string" } } },
    { $group: { _id: "$deliveryKey", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }, { $limit: 10 },
  ]);
  const duplicateProviderIds = await EmailNotification.aggregate([
    { $match: { providerId: { $type: "string" } } },
    { $group: { _id: "$providerId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }, { $limit: 10 },
  ]);
  if (duplicateDeliveryKeys.length || duplicateProviderIds.length) {
    throw new Error(`Index verification blocked: ${duplicateDeliveryKeys.length} duplicate delivery keys and ${duplicateProviderIds.length} duplicate provider IDs found.`);
  }
  const indexes = await EmailNotification.collection.indexes();
  console.log(`Email index dry run passed. ${indexes.length} existing indexes inspected; no indexes changed.`);
}
main().finally(() => mongoose.disconnect());
