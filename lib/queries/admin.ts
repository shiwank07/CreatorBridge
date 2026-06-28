import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { demoCreators, getCreators } from "@/lib/queries/creators";
import {
  type BrandInquiryData,
  type BrandVerificationData,
  type CreatorCardData,
  type CreatorVerificationData,
  type VerificationStatus,
} from "@/lib/types";

type InquiryDocument = {
  _id: { toString(): string };
  companyName: string;
  contactName: string;
  email: string;
  website?: string;
  campaignGoal: string;
  targetNiches?: string[];
  targetPlatforms?: string[];
  budgetRange: string;
  timeline: string;
  message?: string;
  creatorUsername?: string;
  status: BrandInquiryData["status"];
  createdAt?: Date;
};

type CreatorVerificationDocument = {
  _id: { toString(): string };
  userId: {
    username: string;
    name: string;
    avatar: string;
  };
  youtubeUrl?: string;
  youtubeHandle?: string;
  subscribers?: number;
  claimedSubscribers?: number;
  verifiedSubscribers?: number;
  verificationStatus?: VerificationStatus;
  verificationCode?: string;
  verificationNote?: string;
  verificationRejectedReason?: string;
  verificationSubmittedAt?: Date | null;
  verificationReviewedAt?: Date | null;
  verificationCodeExpiresAt?: Date | null;
  lastVerifiedAt?: Date | null;
  createdAt?: Date;
};

type BrandVerificationDocument = {
  _id: { toString(): string };
  userId: {
    username: string;
    isVerified: boolean;
  };
  companyName: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  website?: string;
  industry: string;
  companySize?: string;
  country?: string;
  verificationStatus?: BrandVerificationData["verificationStatus"];
  companyDomain?: string;
  normalizedWebsiteDomain?: string;
  verificationMethod?: BrandVerificationData["verificationMethod"];
  verificationCode?: string;
  verificationSubmittedAt?: Date | null;
  verificationReviewedAt?: Date | null;
  verificationNote?: string;
  rejectionReason?: string;
  createdAt?: Date;
};

function mapInquiry(doc: InquiryDocument): BrandInquiryData {
  return {
    id: doc._id.toString(),
    companyName: doc.companyName,
    contactName: doc.contactName,
    email: doc.email,
    website: doc.website,
    campaignGoal: doc.campaignGoal,
    targetNiches: doc.targetNiches ?? [],
    targetPlatforms: doc.targetPlatforms ?? [],
    budgetRange: doc.budgetRange,
    timeline: doc.timeline,
    message: doc.message,
    creatorUsername: doc.creatorUsername,
    status: doc.status,
    createdAt: doc.createdAt?.toISOString(),
  };
}

function mapCreatorVerification(doc: CreatorVerificationDocument): CreatorVerificationData {
  const user = doc.userId;

  return {
    id: doc._id.toString(),
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    youtubeUrl: doc.youtubeUrl,
    youtubeHandle: doc.youtubeHandle,
    claimedSubscribers: doc.claimedSubscribers ?? doc.subscribers ?? 0,
    verifiedSubscribers: doc.verifiedSubscribers ?? 0,
    verificationStatus: doc.verificationStatus ?? "unverified",
    verificationCode: doc.verificationCode,
    verificationNote: doc.verificationNote,
    verificationRejectedReason: doc.verificationRejectedReason,
    verificationSubmittedAt: doc.verificationSubmittedAt?.toISOString(),
    verificationReviewedAt: doc.verificationReviewedAt?.toISOString(),
    verificationCodeExpiresAt: doc.verificationCodeExpiresAt?.toISOString(),
    lastVerifiedAt: doc.lastVerifiedAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString(),
  };
}

function mapBrandVerification(doc: BrandVerificationDocument): BrandVerificationData {
  const user = doc.userId;

  return {
    id: doc._id.toString(),
    username: user.username,
    companyName: doc.companyName,
    contactName: doc.contactName,
    contactRole: doc.contactRole,
    contactEmail: doc.contactEmail,
    website: doc.website,
    industry: doc.industry,
    companySize: doc.companySize,
    country: doc.country,
    verificationStatus: doc.verificationStatus ?? (user.isVerified ? "verified" : "unverified"),
    companyDomain: doc.companyDomain,
    normalizedWebsiteDomain: doc.normalizedWebsiteDomain,
    verificationMethod: doc.verificationMethod ?? "manual",
    verificationCode: doc.verificationCode,
    verificationSubmittedAt: doc.verificationSubmittedAt?.toISOString(),
    verificationReviewedAt: doc.verificationReviewedAt?.toISOString(),
    verificationNote: doc.verificationNote,
    rejectionReason: doc.rejectionReason,
    createdAt: doc.createdAt?.toISOString(),
  };
}

export async function getAdminMetrics() {
  if (!hasMongoUri()) {
    return {
      creators: demoCreators.length,
      featuredCreators: demoCreators.filter((creator) => creator.isFeatured).length,
      openInquiries: 0,
      verifiedCreators: demoCreators.filter((creator) => creator.verificationStatus === "stats_verified").length,
      pendingVerifications: demoCreators.filter((creator) => creator.youtubeUrl && creator.verificationStatus !== "stats_verified").length,
      pendingBrandVerifications: 0,
    };
  }

  await connectDB();
  const [creators, featuredCreators, openInquiries, verifiedCreators, pendingVerifications, pendingBrandVerifications] = await Promise.all([
    CreatorProfile.countDocuments(),
    User.countDocuments({ isFeatured: true }),
    BrandInquiry.countDocuments({ status: { $in: ["new", "reviewed"] } }),
    CreatorProfile.countDocuments({ verificationStatus: "stats_verified" }),
    CreatorProfile.countDocuments({
      youtubeUrl: { $nin: ["", null] },
      verificationStatus: { $in: ["unverified", "pending_ownership", "ownership_verified"] },
    }),
    BrandProfile.countDocuments({ verificationStatus: "pending" }),
  ]);

  return { creators, featuredCreators, openInquiries, verifiedCreators, pendingVerifications, pendingBrandVerifications };
}

export async function getAdminCreators(): Promise<CreatorCardData[]> {
  return getCreators({ limit: 100, sort: "featured" });
}

export async function getAdminInquiries(): Promise<BrandInquiryData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const docs = await BrandInquiry.find({}).sort({ createdAt: -1 }).limit(100).exec();
  return docs.map((doc) => mapInquiry(doc as unknown as InquiryDocument));
}

export async function getPendingCreatorVerifications(): Promise<CreatorVerificationData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const docs = await CreatorProfile.find({
    youtubeUrl: { $nin: ["", null] },
    verificationStatus: { $in: ["unverified", "pending_ownership", "ownership_verified"] },
  })
    .populate("userId")
    .sort({ updatedAt: -1 })
    .limit(100)
    .exec();

  return docs
    .filter((doc) => Boolean(doc.userId))
    .map((doc) => mapCreatorVerification(doc as unknown as CreatorVerificationDocument));
}

export async function getPendingBrandVerifications(): Promise<BrandVerificationData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const docs = await BrandProfile.find({ verificationStatus: "pending" })
    .populate("userId")
    .sort({ verificationSubmittedAt: -1, updatedAt: -1 })
    .limit(100)
    .exec();

  return docs
    .filter((doc) => Boolean(doc.userId))
    .map((doc) => mapBrandVerification(doc as unknown as BrandVerificationDocument));
}
