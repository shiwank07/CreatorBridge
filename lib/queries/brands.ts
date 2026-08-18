import { connectDB, hasMongoUri, MONGO_QUERY_TIMEOUT_MS } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { type IUser, User } from "@/lib/models/User";
import { type BrandProfileData } from "@/lib/types";

type BrandDocumentWithUser = {
  _id: { toString(): string };
  userId: IUser & { _id: { toString(): string } };
  companyName: string;
  contactName: string;
  contactRole?: string;
  contactEmail?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  website?: string;
  businessSocialUrl?: string;
  industry: string;
  companySize?: string;
  country?: string;
  notes?: string;
  verificationStatus?: BrandProfileData["verificationStatus"];
  verificationNote?: string;
  companyRegistrationText?: string;
  createdAt?: Date;
  displayPublicly?: boolean;
  profileComplete?: boolean;
  completionPercentage?: number;
  completionMissingFields?: string[];
};

export const BRAND_DISCOVERY_COMPLETENESS_FILTER: Record<string, unknown> = { $and: [
  { companyName: { $type: "string", $regex: /\S/ } }, { contactName: { $type: "string", $regex: /\S/ } },
  { contactRole: { $type: "string", $regex: /\S/ } }, { notes: { $type: "string", $regex: /\S.{48,}\S/ } },
  { industry: { $type: "string", $regex: /\S/ } }, { companySize: { $type: "string", $regex: /\S/ } },
  { country: { $type: "string", $regex: /\S/ } }, { $or: [{ website: /^https:\/\//i }, { businessSocialUrl: /^https:\/\//i }] },
  { $or: [{ termsAccepted: true }, { termsAcceptedAt: { $type: "date" } }] },
] };

function mapBrand(doc: BrandDocumentWithUser): BrandProfileData {
  const user = doc.userId;

  return {
    id: doc._id.toString(),
    username: user.username,
    avatar: user.avatar,
    companyName: doc.companyName,
    contactName: doc.contactName,
    contactRole: doc.contactRole,
    contactEmail: doc.contactEmail,
    website: doc.website,
    businessSocialUrl: doc.businessSocialUrl,
    industry: doc.industry,
    companySize: doc.companySize,
    country: doc.country,
    notes: doc.notes,
    verificationStatus: doc.verificationStatus ?? (user.isVerified ? "verified" : "unverified"),
    verificationNote: doc.verificationNote,
    companyRegistrationText: doc.companyRegistrationText,
    emailVerified: Boolean(user.emailVerified),
    phoneAdded: Boolean(user.phoneNumber || doc.phoneNumber),
    phoneVerified: Boolean(user.phoneVerified || doc.phoneVerified),
    createdAt: doc.createdAt?.toISOString(),
    displayPublicly: Boolean(doc.displayPublicly),
    profileComplete: doc.profileComplete,
    completionPercentage: doc.completionPercentage,
    completionMissingFields: doc.completionMissingFields,
  };
}

export async function getPublicBrands(limit = 6): Promise<BrandProfileData[]> {
  if (!hasMongoUri()) return [];
  try {
    await connectDB();
    const profiles = await BrandProfile.find({ displayPublicly: true, ...BRAND_DISCOVERY_COMPLETENESS_FILTER })
      .select("_id userId companyName contactName contactRole website businessSocialUrl industry companySize country notes verificationStatus verificationNote companyRegistrationText createdAt displayPublicly phoneNumber phoneVerified profileComplete completionPercentage completionMissingFields")
      .sort({ verificationStatus: -1, updatedAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 24))
      .maxTimeMS(MONGO_QUERY_TIMEOUT_MS)
      .populate({
        path: "userId",
        match: { role: "brand", onboardingComplete: true, accountStatus: "active" },
        select: "username avatar isVerified emailVerified phoneVerified",
      })
      .lean()
      .exec();
    return profiles
      .filter((profile) => Boolean(profile.userId))
      .map((profile) => mapBrand(profile as unknown as BrandDocumentWithUser));
  } catch {
    return [];
  }
}

export async function getBrandByUsername(username: string): Promise<BrandProfileData | null> {
  if (!hasMongoUri()) return null;

  try {
    await connectDB();
    const user = await User.findOne({
      username: username.toLowerCase(),
      role: "brand",
      onboardingComplete: true,
      accountStatus: { $nin: ["hidden", "suspended"] },
    }).maxTimeMS(MONGO_QUERY_TIMEOUT_MS);
    if (!user) return null;

    const profile = await BrandProfile.findOne({ userId: user._id })
      .populate({
        path: "userId",
        match: { role: "brand", onboardingComplete: true, accountStatus: { $nin: ["hidden", "suspended"] } },
      })
      .maxTimeMS(MONGO_QUERY_TIMEOUT_MS)
      .exec();
    if (!profile?.userId) return null;

    return mapBrand(profile as unknown as BrandDocumentWithUser);
  } catch {
    throw new Error("Brand profile is temporarily unavailable.");
  }
}

export async function getPublicBrandByUsername(username: string): Promise<BrandProfileData | null> {
  if (!hasMongoUri()) return null;
  try {
    await connectDB();
    const user = await User.findOne({ username: username.toLowerCase(), role: "brand", onboardingComplete: true, accountStatus: "active" }).lean();
    if (!user) return null;
    const profile = await BrandProfile.findOne({ userId: user._id, displayPublicly: true, ...BRAND_DISCOVERY_COMPLETENESS_FILTER }).lean();
    return profile ? mapBrand({ ...profile, userId: user } as unknown as BrandDocumentWithUser) : null;
  } catch { return null; }
}
