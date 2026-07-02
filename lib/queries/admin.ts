import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { normalizeCollaborationStatus, type BrandInquiryStatus } from "@/lib/collaborations";
import { demoCreators, getCreators } from "@/lib/queries/creators";
import {
  type BrandInquiryData,
  type BrandVerificationData,
  type CreatorCardData,
  type CreatorVerificationData,
  type VerificationStatus,
} from "@/lib/types";

type OfferHistoryDocument = {
  _id?: { toString(): string };
  actor?: "brand" | "creator";
  action?: "offer_sent" | "counter_requested" | "counter_sent" | "offer_accepted" | "offer_declined";
  amount?: number;
  currency?: "INR";
  note?: string;
  createdAt?: Date | null;
};

type InquiryDocument = {
  _id: { toString(): string };
  companyName: string;
  contactName: string;
  email: string;
  website?: string;
  campaignGoal: string;
  deliverables?: string[];
  targetNiches?: string[];
  targetPlatforms?: string[];
  budgetRange: string;
  initialOfferAmount?: number;
  currentOfferAmount?: number;
  currency?: "INR";
  isNegotiable?: boolean;
  offerHistory?: OfferHistoryDocument[];
  timeline: string;
  message?: string;
  creatorUsername?: string;
  creatorResponseAt?: Date | null;
  creatorResponseNote?: string;
  status: BrandInquiryStatus;
  deliveryProof?: {
    videoUrl?: string;
    timestampStart?: string;
    timestampEnd?: string;
    notes?: string;
    screenshotUrl?: string;
    referenceLink?: string;
    submittedAt?: Date | null;
    reviewedAt?: Date | null;
    reviewNote?: string;
    issueNote?: string;
    issueReportedAt?: Date | null;
  };
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
  verificationPlatform?: CreatorVerificationData["verificationPlatform"];
  verificationProfileUrl?: string;
  verificationSubmittedNote?: string;
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
  companyRegistrationText?: string;
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
  const offerHistory = (doc.offerHistory ?? []).map((entry) => ({
    id: entry._id?.toString(),
    actor: entry.actor ?? "brand",
    action: entry.action ?? "offer_sent",
    amount: entry.amount && entry.amount > 0 ? entry.amount : undefined,
    currency: entry.currency ?? "INR",
    note: entry.note,
    createdAt: entry.createdAt?.toISOString(),
  }));
  const latestOfferAmount = [...offerHistory].reverse().find((entry) => entry.amount)?.amount;

  return {
    id: doc._id.toString(),
    companyName: doc.companyName,
    contactName: doc.contactName,
    email: doc.email,
    website: doc.website,
    campaignGoal: doc.campaignGoal,
    deliverables: doc.deliverables ?? [],
    targetNiches: doc.targetNiches ?? [],
    targetPlatforms: doc.targetPlatforms ?? [],
    budgetRange: doc.budgetRange,
    initialOfferAmount: doc.initialOfferAmount && doc.initialOfferAmount > 0 ? doc.initialOfferAmount : undefined,
    currentOfferAmount: doc.currentOfferAmount && doc.currentOfferAmount > 0 ? doc.currentOfferAmount : latestOfferAmount,
    currency: doc.currency ?? "INR",
    isNegotiable: doc.isNegotiable ?? true,
    offerHistory,
    timeline: doc.timeline,
    message: doc.message,
    creatorUsername: doc.creatorUsername,
    creatorResponseAt: doc.creatorResponseAt?.toISOString(),
    creatorResponseNote: doc.creatorResponseNote,
    status: normalizeCollaborationStatus(doc.status),
    deliveryProof: doc.deliveryProof
      ? {
          videoUrl: doc.deliveryProof.videoUrl,
          timestampStart: doc.deliveryProof.timestampStart,
          timestampEnd: doc.deliveryProof.timestampEnd,
          notes: doc.deliveryProof.notes,
          screenshotUrl: doc.deliveryProof.screenshotUrl,
          referenceLink: doc.deliveryProof.referenceLink,
          submittedAt: doc.deliveryProof.submittedAt?.toISOString(),
          reviewedAt: doc.deliveryProof.reviewedAt?.toISOString(),
          reviewNote: doc.deliveryProof.reviewNote,
          issueNote: doc.deliveryProof.issueNote,
          issueReportedAt: doc.deliveryProof.issueReportedAt?.toISOString(),
        }
      : undefined,
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
    verificationPlatform: doc.verificationPlatform,
    verificationProfileUrl: doc.verificationProfileUrl,
    verificationSubmittedNote: doc.verificationSubmittedNote,
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
    companyRegistrationText: doc.companyRegistrationText,
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
      verifiedCreators: demoCreators.filter((creator) => creator.verificationStatus === "verified").length,
      pendingVerifications: demoCreators.filter((creator) => creator.verificationStatus === "pending").length,
      pendingBrandVerifications: 0,
    };
  }

  await connectDB();
  const [creators, featuredCreators, openInquiries, verifiedCreators, pendingVerifications, pendingBrandVerifications] = await Promise.all([
    CreatorProfile.countDocuments(),
    User.countDocuments({ isFeatured: true }),
    BrandInquiry.countDocuments({
      status: {
        $in: [
          "new",
          "viewed",
          "offer_sent",
          "counter_requested",
          "counter_sent",
          "offer_accepted",
          "interested",
          "work_started",
          "proof_submitted",
          "changes_requested",
          "approved",
          "reviewed",
          "contacted",
          "sent_to_creator",
          "creator_interested",
          "contact_shared",
        ],
      },
    }),
    CreatorProfile.countDocuments({ verificationStatus: { $in: ["verified", "stats_verified", "ownership_verified"] } }),
    CreatorProfile.countDocuments({
      verificationStatus: { $in: ["pending", "pending_ownership"] },
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
    verificationStatus: { $in: ["pending", "pending_ownership"] },
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
