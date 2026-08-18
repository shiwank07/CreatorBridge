import "dotenv/config";

import { connectDB } from "../lib/db";
import { CreatorProfile } from "../lib/models/CreatorProfile";
import { BrandProfile } from "../lib/models/BrandProfile";
import { User } from "../lib/models/User";
import { completionWriteFields, evaluateBrandProfileCompleteness, evaluateCreatorProfileCompleteness } from "../lib/profile-completion";

async function main() {
  const apply = process.argv.includes("--apply");
  await connectDB();
  const counts = { creators: 0, creatorsComplete: 0, brands: 0, brandsComplete: 0, updated: 0 };
  for await (const profile of CreatorProfile.find().cursor()) {
    counts.creators += 1;
    const user = await User.findById(profile.userId).lean();
    const result = evaluateCreatorProfileCompleteness(profile.toObject() as unknown as Record<string, unknown>, (user ?? {}) as unknown as Record<string, unknown>);
    if (result.isComplete) counts.creatorsComplete += 1;
    if (apply) { await CreatorProfile.updateOne({ _id: profile._id }, { $set: completionWriteFields(result) }); counts.updated += 1; }
  }
  for await (const profile of BrandProfile.find().cursor()) {
    counts.brands += 1;
    const user = await User.findById(profile.userId).lean();
    const result = evaluateBrandProfileCompleteness(profile.toObject() as unknown as Record<string, unknown>, (user ?? {}) as unknown as Record<string, unknown>);
    if (result.isComplete) counts.brandsComplete += 1;
    if (apply) { await BrandProfile.updateOne({ _id: profile._id }, { $set: completionWriteFields(result) }); counts.updated += 1; }
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...counts }));
  process.exit(0);
}

main().catch(() => { console.error("Profile completeness backfill failed without emitting record data."); process.exit(1); });
