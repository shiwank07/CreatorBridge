import { connectDB, hasMongoUri } from "@/lib/db";
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
    phoneVerified: Boolean(user.phoneVerified || doc.phoneVerified),
    createdAt: doc.createdAt?.toISOString(),
  };
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
    });
    if (!user) return null;

    const profile = await BrandProfile.findOne({ userId: user._id })
      .populate({
        path: "userId",
        match: { role: "brand", onboardingComplete: true, accountStatus: { $nin: ["hidden", "suspended"] } },
      })
      .exec();
    if (!profile?.userId) return null;

    return mapBrand(profile as unknown as BrandDocumentWithUser);
  } catch {
    return null;
  }
}
