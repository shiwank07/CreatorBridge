import "dotenv/config";
import mongoose from "mongoose";
import { deriveAudience, legacyPlatformAccounts } from "../lib/creator-platforms";
import { CreatorProfile } from "../lib/models/CreatorProfile";

const apply = process.argv.includes("--apply");
const batchSize = Math.min(Math.max(Number(process.argv.find((arg) => arg.startsWith("--batch="))?.split("=")[1] ?? 100), 1), 1000);
async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  if (process.env.NODE_ENV === "production" && apply && process.env.CREATOR_PLATFORM_MIGRATION_ALLOW_PRODUCTION !== "true") throw new Error("Production apply is disabled without explicit CREATOR_PLATFORM_MIGRATION_ALLOW_PRODUCTION=true.");
  await mongoose.connect(process.env.MONGODB_URI);
  let scanned = 0, eligible = 0, updated = 0, invalid = 0;
  const cursor = CreatorProfile.find({ $or: [{ platformAccounts: { $exists: false } }, { platformAccounts: { $size: 0 } }] }).select("youtubeUrl youtubeHandle subscribers claimedSubscribers claimedAverageViews avgViews claimedEngagementRate instagramUrl instagramFollowers podcastUrl verificationStatus platformAccounts").lean().cursor({ batchSize });
  for await (const profile of cursor) {
    scanned += 1;
    const accounts = legacyPlatformAccounts(profile as unknown as Record<string, unknown>);
    if (!accounts.length) { invalid += 1; continue; }
    eligible += 1;
    if (apply) { const audience = deriveAudience(accounts); const result = await CreatorProfile.updateOne({ _id: profile._id, $or: [{ platformAccounts: { $exists: false } }, { platformAccounts: { $size: 0 } }] }, { $set: { platformAccounts: accounts, ...audience } }); updated += result.modifiedCount; }
    if (scanned % batchSize === 0) process.stdout.write(`scanned=${scanned} eligible=${eligible} updated=${updated} invalid=${invalid}\n`);
  }
  process.stdout.write(`mode=${apply ? "apply" : "dry-run"} scanned=${scanned} eligible=${eligible} updated=${updated} invalid=${invalid}\n`);
  await mongoose.disconnect();
}
main().catch((error) => { process.stderr.write(`Creator platform migration failed: ${error instanceof Error ? error.message : "unknown error"}\n`); process.exitCode = 1; });
