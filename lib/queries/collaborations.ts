import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

import {
  appendCollaborationTimeline,
  canRevealCollaborationContactEmail,
  hasCollaborationTimelineEvent,
  normalizeCollaborationStatus,
  type BrandInquiryStatus,
  type CollaborationTimelineEvent,
  type CollaborationStatus,
} from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { hasClerkKeys } from "@/lib/clerk-config";
import {
  type BrandInquiryData,
  type BrandVerificationStatus,
  type CreatorPaymentDetailsData,
  type PaymentStatus,
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

type StatusHistoryDocument = {
  _id?: { toString(): string };
  event?: CollaborationTimelineEvent;
  status?: BrandInquiryStatus;
  actor?: "brand" | "creator" | "admin" | "system";
  note?: string;
  createdAt?: Date | null;
};

type CollaborationDocument = {
  _id: { toString(): string };
  brandUserId?: { toString(): string } | null;
  brandProfileId?: { toString(): string } | null;
  creatorUserId?: { toString(): string } | null;
  creatorProfileId?: { toString(): string } | null;
  companyName: string;
  contactName: string;
  email: string;
  website?: string;
  campaignGoal: string;
  deliverables?: string[];
  targetNiches?: string[];
  targetPlatforms?: string[];
  customPlatformName?: string;
  budgetRange: string;
  initialOfferAmount?: number;
  currentOfferAmount?: number;
  currency?: "INR";
  isNegotiable?: boolean;
  offerHistory?: OfferHistoryDocument[];
  timeline: string;
  message?: string;
  creatorUsername?: string;
  createdByClerkId?: string;
  creatorResponseAt?: Date | null;
  creatorResponseNote?: string;
  paymentStatus?: PaymentStatus;
  paymentNote?: string;
  paymentScreenshotUrl?: string;
  paymentUpdatedAt?: Date | null;
  paymentUpdatedBy?: "brand" | "creator" | "admin" | "system";
  status: BrandInquiryStatus;
  statusHistory?: StatusHistoryDocument[];
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

export type CollaborationDetailsData = BrandInquiryData & {
  brandVerificationStatus: BrandVerificationStatus;
  brandVerificationNote?: string;
  brandEmailVerified?: boolean;
  brandPhoneAdded?: boolean;
  brandPhoneVerified?: boolean;
  creatorVerificationStatus: VerificationStatus;
};

type DashboardUser = {
  id: string;
  username: string;
  name: string;
  role: string;
};

export type CollaborationDashboardData = {
  user: DashboardUser | null;
  collaborations: BrandInquiryData[];
};

export type CollaborationHistorySummaryData = {
  active: number;
  completed: number;
  declined: number;
};

const ACTIVE_HISTORY_QUERY_STATUSES: BrandInquiryStatus[] = [
  "NEW",
  "PENDING_CREATOR_RESPONSE",
  "ACCEPTED",
  "IN_PROGRESS",
  "PROOF_SUBMITTED",
  "REVISION_REQUESTED",
  "APPROVED",
  "new",
  "viewed",
  "offer_sent",
  "counter_requested",
  "counter_sent",
  "offer_accepted",
  "work_started",
  "proof_submitted",
  "changes_requested",
  "approved",
  "interested",
  "reviewed",
  "contacted",
  "sent_to_creator",
  "creator_interested",
  "contact_shared",
];

const COMPLETED_HISTORY_QUERY_STATUSES: BrandInquiryStatus[] = ["COMPLETED", "completed", "closed"];
const DECLINED_HISTORY_QUERY_STATUSES: BrandInquiryStatus[] = ["DECLINED", "CANCELLED", "offer_declined", "creator_declined", "rejected"];

function mapCollaboration(doc: CollaborationDocument): BrandInquiryData {
  const contactEmailRevealed = canRevealCollaborationContactEmail(doc.status);
  const normalizedStatus = normalizeCollaborationStatus(doc.status);
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
  const statusHistory =
    doc.statusHistory?.length
      ? doc.statusHistory.map((entry) => ({
          id: entry._id?.toString(),
          event: entry.event ?? "CREATED",
          status: normalizeCollaborationStatus(entry.status),
          actor: entry.actor ?? "system",
          note: entry.note,
          createdAt: entry.createdAt?.toISOString(),
        }))
      : [
          {
            event: "CREATED" as const,
            status: normalizedStatus,
            actor: "system" as const,
            note: "Collaboration created.",
            createdAt: doc.createdAt?.toISOString(),
          },
        ];

  return {
    id: doc._id.toString(),
    companyName: doc.companyName,
    contactName: doc.contactName,
    email: contactEmailRevealed ? doc.email : "",
    contactEmailRevealed,
    website: doc.website,
    campaignGoal: doc.campaignGoal,
    deliverables: doc.deliverables ?? [],
    targetNiches: doc.targetNiches ?? [],
    targetPlatforms: doc.targetPlatforms ?? [],
    customPlatformName: doc.customPlatformName,
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
    status: normalizedStatus,
    statusHistory,
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
    paymentStatus: doc.paymentStatus ?? "payment_pending",
    paymentNote: doc.paymentNote,
    paymentScreenshotUrl: doc.paymentScreenshotUrl,
    paymentUpdatedAt: doc.paymentUpdatedAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString(),
  };
}

function idsMatch(value: unknown, id: unknown) {
  return Boolean(value && id && value.toString() === id.toString());
}

async function getBrandVerificationStatus(collaboration: CollaborationDocument): Promise<{
  brandVerificationStatus: BrandVerificationStatus;
  brandVerificationNote?: string;
  brandEmailVerified?: boolean;
  brandPhoneAdded?: boolean;
  brandPhoneVerified?: boolean;
}> {
  const profile = collaboration.brandProfileId
    ? await BrandProfile.findById(collaboration.brandProfileId).select("userId verificationStatus verificationNote phoneNumber phoneVerified").exec()
    : await BrandProfile.findOne({ contactEmail: collaboration.email }).select("userId verificationStatus verificationNote phoneNumber phoneVerified").exec();

  if (profile) {
    const brandUser = collaboration.brandUserId
      ? await User.findById(collaboration.brandUserId).select("emailVerified phoneNumber phoneVerified").exec()
      : profile.userId
        ? await User.findById(profile.userId).select("emailVerified phoneNumber phoneVerified").exec()
        : null;

    return {
      brandVerificationStatus: profile.verificationStatus ?? "unverified",
      brandVerificationNote: profile.verificationNote,
      brandEmailVerified: Boolean(brandUser?.emailVerified),
      brandPhoneAdded: Boolean(brandUser?.phoneNumber || profile.phoneNumber),
      brandPhoneVerified: Boolean(brandUser?.phoneVerified || profile.phoneVerified),
    };
  }

  if (collaboration.brandUserId) {
    const brandUser = await User.findById(collaboration.brandUserId).select("isVerified emailVerified phoneNumber phoneVerified").exec();
    if (brandUser) {
      return {
        brandVerificationStatus: brandUser.isVerified ? "verified" : "unverified",
        brandEmailVerified: Boolean(brandUser.emailVerified),
        brandPhoneAdded: Boolean(brandUser.phoneNumber),
        brandPhoneVerified: Boolean(brandUser.phoneVerified),
      };
    }
  }

  return { brandVerificationStatus: "unverified" };
}

async function getCreatorVerificationStatus(collaboration: CollaborationDocument): Promise<VerificationStatus> {
  const profile = collaboration.creatorProfileId
    ? await CreatorProfile.findById(collaboration.creatorProfileId).select("verificationStatus").exec()
    : collaboration.creatorUsername
      ? await User.findOne({ username: collaboration.creatorUsername, role: "creator" })
          .select("_id isVerified")
          .exec()
          .then(async (user) => {
            if (!user) return null;
            return CreatorProfile.findOne({ userId: user._id }).select("verificationStatus").exec();
          })
      : null;

  return (profile?.verificationStatus as VerificationStatus | undefined) ?? "unverified";
}

async function getSharedContactEmails(collaboration: CollaborationDocument): Promise<{
  brandContactEmail?: string;
  creatorContactEmail?: string;
}> {
  if (!canRevealCollaborationContactEmail(collaboration.status)) return {};

  const creator = collaboration.creatorUserId
    ? await User.findById(collaboration.creatorUserId).select("email").exec()
    : collaboration.creatorUsername
      ? await User.findOne({ username: collaboration.creatorUsername, role: "creator" }).select("email").exec()
      : null;

  return {
    brandContactEmail: collaboration.email,
    creatorContactEmail: creator?.email,
  };
}

async function getCreatorPaymentDetails(
  collaboration: CollaborationDocument,
  viewerRole: string,
): Promise<{ creatorPaymentDetails?: CreatorPaymentDetailsData }> {
  if (viewerRole !== "brand" || !canRevealCollaborationContactEmail(collaboration.status)) return {};

  const profile = collaboration.creatorProfileId
    ? await CreatorProfile.findById(collaboration.creatorProfileId)
        .select("upiId paypalEmail bankAccountName bankAccountNumber ifsc preferredPaymentNote")
        .exec()
    : collaboration.creatorUsername
      ? await User.findOne({ username: collaboration.creatorUsername, role: "creator" })
          .select("_id")
          .exec()
          .then(async (creatorUser) => {
            if (!creatorUser) return null;
            return CreatorProfile.findOne({ userId: creatorUser._id })
              .select("upiId paypalEmail bankAccountName bankAccountNumber ifsc preferredPaymentNote")
              .exec();
          })
      : null;

  if (!profile) return {};

  return {
    creatorPaymentDetails: {
      upiId: profile.upiId ?? "",
      paypalEmail: profile.paypalEmail ?? "",
      bankAccountName: profile.bankAccountName ?? "",
      bankAccountNumber: profile.bankAccountNumber ?? "",
      ifsc: profile.ifsc ?? "",
      preferredPaymentNote: profile.preferredPaymentNote ?? "",
    },
  };
}

async function getCurrentUserRecord() {
  if (!hasMongoUri() || !hasClerkKeys()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  return User.findOne({ clerkId: userId }).exec();
}

export async function getCreatorCollaborationDashboard(): Promise<CollaborationDashboardData> {
  const user = await getCurrentUserRecord();
  if (!user) return { user: null, collaborations: [] };

  const creatorProfile = await CreatorProfile.findOne({ userId: user._id }).exec();
  const filters: Record<string, unknown>[] = [{ creatorUsername: user.username }];

  filters.push({ creatorUserId: user._id });
  if (creatorProfile) filters.push({ creatorProfileId: creatorProfile._id });

  const docs = await BrandInquiry.find({ $or: filters }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).exec();

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
    },
    collaborations: docs.map((doc) => mapCollaboration(doc as unknown as CollaborationDocument)),
  };
}

export async function getBrandCollaborationDashboard(): Promise<CollaborationDashboardData> {
  const user = await getCurrentUserRecord();
  if (!user) return { user: null, collaborations: [] };

  const brandProfile = await BrandProfile.findOne({ userId: user._id }).exec();
  const filters: Record<string, unknown>[] = [{ createdByClerkId: user.clerkId }, { brandUserId: user._id }];

  if (brandProfile) {
    filters.push({ brandProfileId: brandProfile._id });
    filters.push({ email: brandProfile.contactEmail });
  }

  const docs = await BrandInquiry.find({ $or: filters }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).exec();

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
    },
    collaborations: docs.map((doc) => mapCollaboration(doc as unknown as CollaborationDocument)),
  };
}

export async function getCreatorCollaborationHistorySummary(username: string): Promise<CollaborationHistorySummaryData> {
  const creatorUsername = username.trim().toLowerCase();
  if (!hasMongoUri() || !creatorUsername) return { active: 0, completed: 0, declined: 0 };

  let active = 0;
  let completed = 0;
  let declined = 0;

  try {
    await connectDB();
    const baseFilter = { creatorUsername };
    [active, completed, declined] = await Promise.all([
      BrandInquiry.countDocuments({ ...baseFilter, status: { $in: ACTIVE_HISTORY_QUERY_STATUSES } }).exec(),
      BrandInquiry.countDocuments({ ...baseFilter, status: { $in: COMPLETED_HISTORY_QUERY_STATUSES } }).exec(),
      BrandInquiry.countDocuments({ ...baseFilter, status: { $in: DECLINED_HISTORY_QUERY_STATUSES } }).exec(),
    ]);
  } catch (error) {
    console.warn("Creator collaboration history unavailable; using public fallback counts.", error);
  }

  return { active, completed, declined };
}

export async function getCurrentUserCollaborationDetails(id: string): Promise<CollaborationDetailsData | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const user = await getCurrentUserRecord();
  if (!user) return null;

  const collaboration = await BrandInquiry.findById(id).exec();
  if (!collaboration) return null;

  const doc = collaboration as unknown as CollaborationDocument;
  let canView = false;

  if (user.role === "creator") {
    const creatorProfile = await CreatorProfile.findOne({ userId: user._id }).select("_id").exec();
    canView =
      doc.creatorUsername === user.username ||
      idsMatch(doc.creatorUserId, user._id) ||
      idsMatch(doc.creatorProfileId, creatorProfile?._id);
  }

  if (user.role === "brand") {
    const brandProfile = await BrandProfile.findOne({ userId: user._id }).select("_id contactEmail").exec();
    canView =
      doc.createdByClerkId === user.clerkId ||
      idsMatch(doc.brandUserId, user._id) ||
      idsMatch(doc.brandProfileId, brandProfile?._id) ||
      (brandProfile?.contactEmail ? doc.email === brandProfile.contactEmail : false);
  }

  if (!canView) return null;

  if ((user.role === "creator" || user.role === "brand") && !hasCollaborationTimelineEvent(doc, "VIEWED", user.role)) {
    appendCollaborationTimeline(collaboration, {
      event: "VIEWED",
      status: doc.status,
      actor: user.role,
      note: `${user.role === "creator" ? "Creator" : "Brand"} viewed the collaboration.`,
    });
    await collaboration.save();
  }

  const updatedDoc = collaboration as unknown as CollaborationDocument;

  return {
    ...mapCollaboration(updatedDoc),
    ...(await getSharedContactEmails(updatedDoc)),
    ...(await getCreatorPaymentDetails(updatedDoc, user.role)),
    ...(await getBrandVerificationStatus(updatedDoc)),
    creatorVerificationStatus: await getCreatorVerificationStatus(updatedDoc),
  };
}

export function groupCollaborationsByStatus(collaborations: BrandInquiryData[], statuses: CollaborationStatus[]) {
  return collaborations.filter((collaboration) => statuses.includes(collaboration.status));
}
