import { config } from "dotenv";
import mongoose from "mongoose";

import { classifyCreatorViewBackfill, deriveLifecycleTimestampBackfill, resolveOwnershipBackfill } from "../lib/analytics/migration";
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
const SAMPLE_LIMIT = 100;

type Report = {
  dryRun: boolean;
  concurrencyMode: string;
  scanned: number;
  matched: number;
  alreadyValid: number;
  ambiguous: number;
  unresolved: number;
  plannedUpdates: number;
  updated: number;
  conditionalWriteConflicts: number;
  timestampFields: Record<string, number>;
  creatorViews: { validBackfilled: number; alreadyPopulated: number; ambiguous: number; missingActor: number; unresolved: number };
  ambiguousIdSamples: string[];
  unresolvedIdSamples: string[];
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
  firstCreatorViewedAt?: Date | null;
  firstCreatorResponseAt?: Date | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  cancelledAt?: Date | null;
  workStartedAt?: Date | null;
  proofSubmittedAt?: Date | null;
  completedAt?: Date | null;
  lastMeaningfulActivityAt?: Date | null;
};

function sample(target: string[], id: unknown) {
  if (target.length < SAMPLE_LIMIT) target.push(String(id));
}

function key(value: unknown) {
  return value ? String(value) : "";
}

async function batchOwnership(records: MigrationRecord[]) {
  const clerkIds = [...new Set(records.filter((record) => !record.brandUserId && record.createdByClerkId).map((record) => record.createdByClerkId!))];
  const emails = [...new Set(records.filter((record) => !record.brandUserId && record.email).map((record) => record.email!))];
  const usernames = [...new Set(records.filter((record) => !record.creatorUserId && record.creatorUsername).map((record) => record.creatorUsername!))];
  const [brandUsers, emailProfiles, creatorUsers] = await Promise.all([
    User.find({ clerkId: { $in: clerkIds }, role: "brand" }).select("_id clerkId").lean(),
    BrandProfile.find({ contactEmail: { $in: emails } }).select("_id userId contactEmail").lean(),
    User.find({ username: { $in: usernames }, role: "creator" }).select("_id username").lean(),
  ]);
  const brandProfiles = await BrandProfile.find({ userId: { $in: brandUsers.map((user) => user._id) } }).select("_id userId").lean();
  const creatorProfiles = await CreatorProfile.find({ userId: { $in: creatorUsers.map((user) => user._id) } }).select("_id userId").lean();
  return {
    brandUsers: new Map(brandUsers.map((user) => [user.clerkId, user])),
    brandProfiles: new Map(brandProfiles.map((profile) => [key(profile.userId), profile])),
    emailProfiles: emailProfiles.reduce<Map<string, typeof emailProfiles>>((map, profile) => {
      const list = map.get(profile.contactEmail) ?? [];
      list.push(profile);
      map.set(profile.contactEmail, list);
      return map;
    }, new Map()),
    creatorUsers: new Map(creatorUsers.map((user) => [user.username, user])),
    creatorProfiles: new Map(creatorProfiles.map((profile) => [key(profile.userId), profile])),
  };
}

async function run() {
  await connectDB();
  const report: Report = {
    dryRun: !write,
    concurrencyMode: "Each timestamp update requires the field to remain null or missing; concurrent runtime writes win. Maintenance mode is recommended for operational predictability but is not required for timestamp safety.",
    scanned: 0,
    matched: 0,
    alreadyValid: 0,
    ambiguous: 0,
    unresolved: 0,
    plannedUpdates: 0,
    updated: 0,
    conditionalWriteConflicts: 0,
    timestampFields: {},
    creatorViews: { validBackfilled: 0, alreadyPopulated: 0, ambiguous: 0, missingActor: 0, unresolved: 0 },
    ambiguousIdSamples: [],
    unresolvedIdSamples: [],
  };
  let afterId: mongoose.Types.ObjectId | null = null;
  while (true) {
    const records: MigrationRecord[] = await BrandInquiry.find(afterId ? { _id: { $gt: afterId } } : {})
      .sort({ _id: 1 })
      .limit(batchSize)
      .select("brandUserId brandProfileId creatorUserId creatorProfileId createdByClerkId email creatorUsername statusHistory firstCreatorViewedAt firstCreatorResponseAt acceptedAt rejectedAt cancelledAt workStartedAt proofSubmittedAt completedAt lastMeaningfulActivityAt")
      .lean<MigrationRecord[]>();
    if (!records.length) break;
    const lookups = await batchOwnership(records);
    const timestampOperations: Parameters<typeof BrandInquiry.bulkWrite>[0] = [];
    const ownershipOperations: Parameters<typeof BrandInquiry.bulkWrite>[0] = [];
    for (const record of records) {
      report.scanned += 1;
      const clerkUser = record.createdByClerkId ? lookups.brandUsers.get(record.createdByClerkId) : null;
      const clerkProfile = clerkUser ? lookups.brandProfiles.get(key(clerkUser._id)) : null;
      const creatorUser = record.creatorUsername ? lookups.creatorUsers.get(record.creatorUsername) : null;
      const creatorProfile = creatorUser ? lookups.creatorProfiles.get(key(creatorUser._id)) : null;
      const emailProfiles = record.email ? lookups.emailProfiles.get(record.email) ?? [] : [];
      const ownership = resolveOwnershipBackfill({
        currentBrandUserId: record.brandUserId,
        currentBrandProfileId: record.brandProfileId,
        currentCreatorUserId: record.creatorUserId,
        currentCreatorProfileId: record.creatorProfileId,
        clerkBrand: clerkUser ? { userId: clerkUser._id, profileId: clerkProfile?._id } : null,
        emailBrands: emailProfiles.map((profile) => ({ userId: profile.userId, profileId: profile._id })),
        usernameCreator: creatorUser ? { userId: creatorUser._id, profileId: creatorProfile?._id } : null,
      });
      const view = classifyCreatorViewBackfill(record);
      if (view.status === "valid") report.creatorViews.validBackfilled += 1;
      else if (view.status === "already_populated") report.creatorViews.alreadyPopulated += 1;
      else if (view.status === "ambiguous") report.creatorViews.ambiguous += 1;
      else if (view.status === "missing_actor") report.creatorViews.missingActor += 1;
      else report.creatorViews.unresolved += 1;
      const timestampSet = deriveLifecycleTimestampBackfill(record);
      for (const [field, value] of Object.entries(timestampSet)) {
        report.timestampFields[field] = (report.timestampFields[field] ?? 0) + 1;
        report.plannedUpdates += 1;
        timestampOperations.push({
          updateOne: {
            filter: { _id: record._id, $or: [{ [field]: null }, { [field]: { $exists: false } }] },
            update: { $set: { [field]: value } },
          },
        });
      }
      if (ownership.ambiguous) {
        report.ambiguous += 1;
        sample(report.ambiguousIdSamples, record._id);
      }
      const canonicalAfter = {
        brand: Boolean(record.brandUserId || ownership.set.brandUserId),
        creator: Boolean(record.creatorUserId || ownership.set.creatorUserId),
      };
      if (!canonicalAfter.brand || !canonicalAfter.creator) {
        report.unresolved += 1;
        sample(report.unresolvedIdSamples, record._id);
      } else report.matched += 1;
      for (const [field, value] of Object.entries(ownership.set)) {
        report.plannedUpdates += 1;
        ownershipOperations.push({
          updateOne: {
            filter: { _id: record._id, $or: [{ [field]: null }, { [field]: { $exists: false } }] },
            update: { $set: { [field]: value } },
          },
        });
      }
      if (!Object.keys(timestampSet).length && !Object.keys(ownership.set).length) report.alreadyValid += 1;
    }
    if (write) {
      if (timestampOperations.length) {
        const result = await BrandInquiry.bulkWrite(timestampOperations, { ordered: false });
        report.updated += result.modifiedCount;
        report.conditionalWriteConflicts += timestampOperations.length - result.modifiedCount;
      }
      if (ownershipOperations.length) {
        const result = await BrandInquiry.bulkWrite(ownershipOperations, { ordered: false });
        report.updated += result.modifiedCount;
        report.conditionalWriteConflicts += ownershipOperations.length - result.modifiedCount;
      }
    }
    afterId = records[records.length - 1]._id;
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

run().then(() => process.exit(0)).catch(() => {
  process.stderr.write("Analytics migration failed. Inspect protected database logs.\n");
  process.exit(1);
});
