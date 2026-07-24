import { config } from "dotenv";
import mongoose from "mongoose";
import { deriveLifecycleTimestampBackfill, resolveOwnershipBackfill } from "../lib/analytics/migration";
import { connectDB } from "../lib/db";
import { BrandInquiry } from "../lib/models/BrandInquiry";
import { BrandProfile } from "../lib/models/BrandProfile";
import { CreatorProfile } from "../lib/models/CreatorProfile";
import { User } from "../lib/models/User";

config({ path: ".env.local" });
config();

const write = process.argv.includes("--write");
const batchArgument = process.argv.find((argument) => argument.startsWith("--batch="));
const batchSize = Math.max(1, Math.min(1000, Number(batchArgument?.split("=")[1] ?? 250)));

type Report = {
  dryRun: boolean;
  scanned: number;
  matched: number;
  alreadyValid: number;
  ambiguous: number;
  unresolved: number;
  updated: number;
  timestampFields: Record<string, number>;
  ambiguousIds: string[];
  unresolvedIds: string[];
};

type MigrationRecord = {
  _id: mongoose.Types.ObjectId;
  brandUserId?: mongoose.Types.ObjectId | null;
  brandProfileId?: mongoose.Types.ObjectId | null;
  creatorUserId?: mongoose.Types.ObjectId | null;
  creatorProfileId?: mongoose.Types.ObjectId | null;
  createdByClerkId?: string;
  email?: string;
  creatorUsername?: string;
  statusHistory?: Array<{ event?: string; actor?: string; createdAt?: Date | null }>;
  firstViewedAt?: Date | null;
  firstCreatorResponseAt?: Date | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  cancelledAt?: Date | null;
  workStartedAt?: Date | null;
  proofSubmittedAt?: Date | null;
  completedAt?: Date | null;
  lastMeaningfulActivityAt?: Date | null;
};

async function run() {
  await connectDB();
  const report: Report = {
    dryRun: !write,
    scanned: 0,
    matched: 0,
    alreadyValid: 0,
    ambiguous: 0,
    unresolved: 0,
    updated: 0,
    timestampFields: {},
    ambiguousIds: [],
    unresolvedIds: [],
  };
  let afterId: mongoose.Types.ObjectId | null = null;
  while (true) {
    const records: MigrationRecord[] = await BrandInquiry.find(afterId ? { _id: { $gt: afterId } } : {})
      .sort({ _id: 1 })
      .limit(batchSize)
      .select("brandUserId brandProfileId creatorUserId creatorProfileId createdByClerkId email creatorUsername statusHistory firstViewedAt firstCreatorResponseAt acceptedAt rejectedAt cancelledAt workStartedAt proofSubmittedAt completedAt lastMeaningfulActivityAt")
      .lean<MigrationRecord[]>();
    if (!records.length) break;
    const operations: Parameters<typeof BrandInquiry.bulkWrite>[0] = [];
    for (const record of records) {
      report.scanned += 1;
      const [clerkUser, emailProfiles, creatorUser] = await Promise.all([
        !record.brandUserId && record.createdByClerkId ? User.findOne({ clerkId: record.createdByClerkId, role: "brand" }).select("_id").lean() : null,
        !record.brandUserId && record.email ? BrandProfile.find({ contactEmail: record.email }).select("_id userId").limit(2).lean() : [],
        (!record.creatorUserId || !record.creatorProfileId) && record.creatorUsername ? User.findOne({ username: record.creatorUsername, role: "creator" }).select("_id").lean() : null,
      ]);
      const [clerkProfile, creatorProfile] = await Promise.all([
        clerkUser ? BrandProfile.findOne({ userId: clerkUser._id }).select("_id").lean() : null,
        creatorUser ? CreatorProfile.findOne({ userId: creatorUser._id }).select("_id").lean() : null,
      ]);
      const ownership = resolveOwnershipBackfill({
        currentBrandUserId: record.brandUserId,
        currentBrandProfileId: record.brandProfileId,
        currentCreatorUserId: record.creatorUserId,
        currentCreatorProfileId: record.creatorProfileId,
        clerkBrand: clerkUser ? { userId: clerkUser._id, profileId: clerkProfile?._id } : null,
        emailBrands: emailProfiles.map((profile) => ({ userId: profile.userId, profileId: profile._id })),
        usernameCreator: creatorUser ? { userId: creatorUser._id, profileId: creatorProfile?._id } : null,
      });
      const timestampSet = deriveLifecycleTimestampBackfill(record);
      Object.keys(timestampSet).forEach((field) => { report.timestampFields[field] = (report.timestampFields[field] ?? 0) + 1; });
      if (ownership.ambiguous) {
        report.ambiguous += 1;
        report.ambiguousIds.push(String(record._id));
      }
      const canonicalAfter = {
        brand: Boolean(record.brandUserId || ownership.set.brandUserId),
        creator: Boolean(record.creatorUserId || ownership.set.creatorUserId),
      };
      if (!canonicalAfter.brand || !canonicalAfter.creator) {
        report.unresolved += 1;
        report.unresolvedIds.push(String(record._id));
      } else {
        report.matched += 1;
      }
      const set = { ...ownership.set, ...timestampSet };
      if (!Object.keys(set).length) report.alreadyValid += 1;
      else {
        report.updated += 1;
        operations.push({ updateOne: { filter: { _id: record._id }, update: { $set: set } } });
      }
    }
    if (write && operations.length) await BrandInquiry.bulkWrite(operations, { ordered: false });
    afterId = records[records.length - 1]._id;
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

run().then(() => process.exit(0)).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
