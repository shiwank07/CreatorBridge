import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { demoCreators, getCreators } from "@/lib/queries/creators";
import {
  type BrandInquiryData,
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
  status: "new" | "reviewed" | "contacted" | "closed";
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
  lastVerifiedAt?: Date | null;
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
    lastVerifiedAt: doc.lastVerifiedAt?.toISOString(),
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
    };
  }

  await connectDB();
  const [creators, featuredCreators, openInquiries, verifiedCreators, pendingVerifications] = await Promise.all([
    CreatorProfile.countDocuments(),
    User.countDocuments({ isFeatured: true }),
    BrandInquiry.countDocuments({ status: { $in: ["new", "reviewed"] } }),
    CreatorProfile.countDocuments({ verificationStatus: "stats_verified" }),
    CreatorProfile.countDocuments({
      youtubeUrl: { $nin: ["", null] },
      verificationStatus: { $in: ["unverified", "ownership_verified"] },
    }),
  ]);

  return { creators, featuredCreators, openInquiries, verifiedCreators, pendingVerifications };
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
    verificationStatus: { $in: ["unverified", "ownership_verified"] },
  })
    .populate("userId")
    .sort({ updatedAt: -1 })
    .limit(100)
    .exec();

  return docs
    .filter((doc) => Boolean(doc.userId))
    .map((doc) => mapCreatorVerification(doc as unknown as CreatorVerificationDocument));
}
