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
  industry: string;
  companySize?: string;
  country?: string;
  notes?: string;
  verificationStatus?: BrandProfileData["verificationStatus"];
  verificationNote?: string;
  companyRegistrationText?: string;
  createdAt?: Date;
  displayPublicly?: boolean;
};

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
  };
}

export async function getPublicBrands(limit = 6): Promise<BrandProfileData[]> {
  if (!hasMongoUri()) return [];
  try {
    await connectDB();
    const profiles = await BrandProfile.find({ displayPublicly: true })
      .select("_id userId companyName contactName contactRole website industry companySize country notes verificationStatus verificationNote companyRegistrationText createdAt displayPublicly phoneNumber phoneVerified")
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
    return null;
  }
}

export async function getPublicBrandByUsername(username: string): Promise<BrandProfileData | null> {
  const brand = await getBrandByUsername(username);
  return brand?.displayPublicly ? brand : null;
}
