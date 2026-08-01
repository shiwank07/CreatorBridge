import mongoose from "mongoose";

import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { EmailNotification } from "@/lib/models/EmailNotification";
import { User } from "@/lib/models/User";
import {
  BRAND_INQUIRY_STATUS_VALUES,
  normalizeCollaborationStatus,
  type BrandInquiryStatus,
  type CollaborationTimelineEvent,
} from "@/lib/collaborations";
import { demoCreators } from "@/lib/queries/creators";
import {
  type BrandInquiryData,
  type AdminBrandData,
  type BrandVerificationData,
  type AdminContactData,
  type AdminCollaborationData,
  type AdminCreatorData,
  type AdminEmailLogData,
  type AdminReportData,
  type AdminReportStatus,
  type AdminSearchResultData,
  type AdminUserData,
  type AccountStatus,
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

type StatusHistoryDocument = {
  _id?: { toString(): string };
  event?: CollaborationTimelineEvent;
  status?: BrandInquiryStatus;
  actor?: "brand" | "creator" | "admin" | "system";
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
  creatorResponseAt?: Date | null;
  creatorResponseNote?: string;
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
  claimedAverageViews?: number;
  verifiedAverageViews?: number;
  claimedEngagementRate?: number;
  verifiedEngagementRate?: number;
  statsVerificationStatus?: CreatorVerificationData["statsVerificationStatus"];
  verificationStatus?: VerificationStatus;
  verificationCode?: string;
  verificationPlatform?: CreatorVerificationData["verificationPlatform"];
  customPlatformName?: string;
  verificationProfileUrl?: string;
  verificationSubmittedNote?: string;
  verificationNote?: string;
  verificationRejectedReason?: string;
  verificationSubmittedAt?: Date | null;
  verificationReviewedAt?: Date | null;
  verificationCodeExpiresAt?: Date | null;
  avgViews?: number;
  verifiedAt?: Date | null;
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

type PopulatedUserDocument = {
  _id: { toString(): string };
  username: string;
  name: string;
  email: string;
  avatar?: string;
  role: "creator" | "brand" | "agency" | "talent";
  isVerified?: boolean;
  accountStatus?: AccountStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

type AdminCreatorDocument = {
  _id: { toString(): string };
  userId: PopulatedUserDocument;
  verificationStatus?: VerificationStatus;
  createdAt?: Date;
};

type AdminBrandDocument = {
  _id: { toString(): string };
  profile?: {
    _id: { toString(): string };
    companyName?: string;
    contactEmail?: string;
    verificationStatus?: BrandVerificationData["verificationStatus"];
  };
  name: string;
  username: string;
  email: string;
  avatar?: string;
  isVerified?: boolean;
  accountStatus?: AccountStatus;
  onboardingComplete?: boolean;
  collaborationCount?: number;
  createdAt?: Date;
};

type PopulatedAdminBrandProfileDocument = {
  userId: PopulatedUserDocument;
  companyName: string;
  contactEmail?: string;
  verificationStatus?: BrandVerificationData["verificationStatus"];
};

type AdminCollaborationDocument = InquiryDocument & {
  updatedAt?: Date;
};

type AdminReportDocument = InquiryDocument & {
  updatedAt?: Date;
  deliveryProof?: InquiryDocument["deliveryProof"] & {
    issueStatus?: AdminReportStatus;
    issueReviewedAt?: Date | null;
    issueReviewedByAdminId?: string;
  };
};

type AdminEmailNotificationDocument = {
  _id: { toString(): string };
  recipient: string;
  event: string;
  status: AdminEmailLogData["status"];
  deliveryKey?: string;
  attempts?: number;
  providerId?: string | null;
  retryable?: boolean;
  error?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deliveredAt?: Date;
};

type AdminContactUserDocument = {
  _id: { toString(): string };
  username: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  role: "creator" | "brand";
  updatedAt?: Date;
};

type AdminCreatorContactProfileDocument = {
  userId: { toString(): string };
  country?: string;
  verificationStatus?: VerificationStatus;
};

type AdminBrandContactProfileDocument = {
  userId: { toString(): string };
  companyName: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  country?: string;
  verificationStatus?: BrandVerificationData["verificationStatus"];
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
  const normalizedStatus = normalizeCollaborationStatus(doc.status);
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
    email: doc.email,
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
    createdAt: doc.createdAt?.toISOString(),
  };
}

function mapCreatorVerification(doc: CreatorVerificationDocument): CreatorVerificationData {
  const user = doc.userId;
  const claimedAverageViews = doc.claimedAverageViews ?? doc.avgViews ?? 0;
  const verifiedSubscribers = doc.verifiedSubscribers ?? 0;
  const verifiedAverageViews = doc.verifiedAverageViews ?? 0;
  const verifiedEngagementRate = doc.verifiedEngagementRate ?? 0;
  const hasVerifiedStatSnapshot = verifiedSubscribers > 0 || verifiedAverageViews > 0 || verifiedEngagementRate > 0;
  const statsVerificationStatus =
    doc.statsVerificationStatus && doc.statsVerificationStatus !== "unverified"
      ? doc.statsVerificationStatus
      : (doc.verificationStatus === "verified" || doc.verificationStatus === "stats_verified" || doc.verificationStatus === "ownership_verified") &&
          hasVerifiedStatSnapshot
        ? "verified"
        : doc.statsVerificationStatus ?? "unverified";

  return {
    id: doc._id.toString(),
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    youtubeUrl: doc.youtubeUrl,
    youtubeHandle: doc.youtubeHandle,
    claimedSubscribers: doc.claimedSubscribers ?? doc.subscribers ?? 0,
    verifiedSubscribers,
    claimedAverageViews,
    verifiedAverageViews,
    claimedEngagementRate: doc.claimedEngagementRate ?? 0,
    verifiedEngagementRate,
    statsVerificationStatus,
    verificationStatus: doc.verificationStatus ?? "unverified",
    verificationCode: doc.verificationCode,
    verificationPlatform: doc.verificationPlatform,
    customPlatformName: doc.customPlatformName,
    verificationProfileUrl: doc.verificationProfileUrl,
    verificationSubmittedNote: doc.verificationSubmittedNote,
    verificationNote: doc.verificationNote,
    verificationRejectedReason: doc.verificationRejectedReason,
    verificationSubmittedAt: doc.verificationSubmittedAt?.toISOString(),
    verificationReviewedAt: doc.verificationReviewedAt?.toISOString(),
    verificationCodeExpiresAt: doc.verificationCodeExpiresAt?.toISOString(),
    verifiedAt: doc.verifiedAt?.toISOString(),
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

function accountStatus(user?: { accountStatus?: AccountStatus }): AccountStatus {
  return user?.accountStatus ?? "active";
}

function mapAdminCreator(doc: AdminCreatorDocument): AdminCreatorData {
  const user = doc.userId;

  return {
    userId: user._id.toString(),
    profileId: doc._id.toString(),
    avatar: user.avatar ?? "",
    name: user.name,
    username: user.username,
    email: user.email,
    verificationStatus: doc.verificationStatus ?? (user.isVerified ? "verified" : "unverified"),
    accountStatus: accountStatus(user),
    joinedDate: user.createdAt?.toISOString() ?? doc.createdAt?.toISOString(),
  };
}

function mapAdminBrand(doc: AdminBrandDocument): AdminBrandData {
  const profile = doc.profile;

  return {
    userId: doc._id.toString(),
    profileId: profile?._id.toString(),
    logo: doc.avatar ?? "",
    companyName: profile?.companyName || doc.name,
    username: doc.username,
    email: doc.email,
    verificationStatus: profile?.verificationStatus ?? (doc.isVerified ? "verified" : "unverified"),
    profileStatus: doc.onboardingComplete && profile ? "complete" : "incomplete",
    accountStatus: accountStatus(doc),
    collaborationCount: doc.collaborationCount ?? 0,
    joinedDate: doc.createdAt?.toISOString(),
  };
}

function mapAdminCollaboration(doc: AdminCollaborationDocument): AdminCollaborationData {
  return {
    id: doc._id.toString(),
    brand: doc.companyName,
    brandEmail: doc.email,
    creator: doc.creatorUsername ? `@${doc.creatorUsername}` : "Open brief",
    status: normalizeCollaborationStatus(doc.status),
    budget: doc.currentOfferAmount && doc.currentOfferAmount > 0 ? `INR ${doc.currentOfferAmount.toLocaleString("en-IN")}` : doc.budgetRange,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? doc.createdAt?.toISOString(),
  };
}

function mapAdminReport(doc: AdminReportDocument): AdminReportData {
  return {
    id: doc._id.toString(),
    reporter: `${doc.companyName} (${doc.email})`,
    reportedUser: doc.creatorUsername ? `@${doc.creatorUsername}` : "Creator not assigned",
    reportedUsername: doc.creatorUsername,
    reason: doc.deliveryProof?.issueNote || doc.deliveryProof?.reviewNote || "Delivery issue reported.",
    status: doc.deliveryProof?.issueStatus ?? "open",
    createdAt: doc.deliveryProof?.issueReportedAt?.toISOString() ?? doc.updatedAt?.toISOString() ?? doc.createdAt?.toISOString(),
  };
}

function mapAdminEmailLog(doc: AdminEmailNotificationDocument): AdminEmailLogData {
  return {
    id: doc._id.toString(),
    recipient: doc.recipient,
    event: doc.event,
    status: doc.status,
    deliveryKey: doc.deliveryKey,
    attempts: doc.attempts ?? 0,
    providerId: doc.providerId,
    retryEligible: doc.status === "failed" && Boolean(doc.retryable) &&
      Boolean(doc.deliveryKey?.startsWith("contact:confirmation:") || doc.deliveryKey?.startsWith("contact:admin-alert:")),
    error: doc.error,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
    deliveredAt: doc.deliveredAt?.toISOString(),
  };
}

export async function getAdminMetrics() {
  if (!hasMongoUri()) {
    return {
      totalCreators: demoCreators.length,
      totalBrands: 0,
      activeCollaborations: 0,
      pendingVerifications: demoCreators.filter((creator) => creator.verificationStatus === "pending").length,
      openReports: 0,
      emailsSentToday: 0,
    };
  }

  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeStatuses: BrandInquiryStatus[] = [
    "NEW",
    "PENDING_CREATOR_RESPONSE",
    "NEGOTIATING",
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
  ];
  const [totalCreators, totalBrands, activeCollaborations, pendingCreatorVerifications, pendingBrandVerifications, openReports, emailsSentToday] = await Promise.all([
    CreatorProfile.countDocuments(),
    User.countDocuments({ role: "brand" }),
    BrandInquiry.countDocuments({
      status: {
        $in: activeStatuses,
      },
    }),
    CreatorProfile.countDocuments({
      $or: [
        { verificationStatus: { $in: ["pending", "pending_ownership", "needs_review"] } },
        { statsVerificationStatus: { $in: ["pending", "needs_review"] } },
      ],
    }),
    BrandProfile.countDocuments({ verificationStatus: "pending" }),
    BrandInquiry.countDocuments({
      "deliveryProof.issueReportedAt": { $ne: null },
      "deliveryProof.issueStatus": { $nin: ["resolved", "dismissed"] },
    }),
    EmailNotification.countDocuments({ status: "sent", createdAt: { $gte: today } }),
  ]);

  return {
    totalCreators,
    totalBrands,
    activeCollaborations,
    pendingVerifications: pendingCreatorVerifications + pendingBrandVerifications,
    openReports,
    emailsSentToday,
  };
}

export async function getAdminInquiryById(id: string): Promise<BrandInquiryData | null> {
  if (!hasMongoUri()) return null;

  await connectDB();
  const doc = await BrandInquiry.findById(id).exec();
  return doc ? mapInquiry(doc as unknown as InquiryDocument) : null;
}

export async function getAdminReports(): Promise<AdminReportData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  // The reports screen is an operational triage queue, deliberately bounded
  // to the 200 most recently reported issues pending its own pagination pass.
  const ADMIN_REPORT_TRIAGE_LIMIT = 200;
  const docs = await BrandInquiry.find({ "deliveryProof.issueReportedAt": { $ne: null } })
    .sort({ "deliveryProof.issueReportedAt": -1, updatedAt: -1 })
    .limit(ADMIN_REPORT_TRIAGE_LIMIT)
    .exec();

  return docs.map((doc) => mapAdminReport(doc as unknown as AdminReportDocument));
}

export async function searchAdminDirectory(query: string): Promise<AdminSearchResultData[]> {
  const search = query.trim();
  if (!hasMongoUri() || search.length < 2) return [];

  await connectDB();
  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const [users, creators, brands] = await Promise.all([
    User.find({
      role: { $in: ["creator", "brand"] },
      $or: [{ name: regex }, { username: regex }, { email: regex }],
    })
      .select("_id username name email role accountStatus isVerified")
      .limit(8)
      .exec(),
    CreatorProfile.find({ $or: [{ bio: regex }, { niche: regex }] })
      .populate({ path: "userId", match: { role: "creator" } })
      .limit(8)
      .exec(),
    BrandProfile.find({ $or: [{ companyName: regex }, { contactEmail: regex }, { industry: regex }] })
      .populate({ path: "userId", match: { role: "brand" } })
      .limit(8)
      .exec(),
  ]);

  const results = new Map<string, AdminSearchResultData>();

  for (const user of users) {
    const doc = user as unknown as PopulatedUserDocument;
    results.set(`user:${doc._id.toString()}`, {
      id: doc._id.toString(),
      type: "user",
      title: doc.name,
      subtitle: `${doc.role} - @${doc.username} - ${doc.email}`,
      href: "/admin/users",
      status: accountStatus(doc),
    });
  }

  for (const creator of creators) {
    const doc = creator as unknown as AdminCreatorDocument;
    if (!doc.userId) continue;
    results.set(`creator:${doc.userId._id.toString()}`, {
      id: doc.userId._id.toString(),
      type: "creator",
      title: doc.userId.name,
      subtitle: `Creator - @${doc.userId.username}`,
      href: `/creators/${doc.userId.username}`,
      status: doc.verificationStatus ?? "unverified",
    });
  }

  for (const brand of brands) {
    const doc = brand as unknown as PopulatedAdminBrandProfileDocument;
    if (!doc.userId) continue;
    results.set(`brand:${doc.userId._id.toString()}`, {
      id: doc.userId._id.toString(),
      type: "brand",
      title: doc.companyName,
      subtitle: `Brand - @${doc.userId.username} - ${doc.contactEmail || doc.userId.email}`,
      href: `/brands/${doc.userId.username}`,
      status: doc.verificationStatus ?? "unverified",
    });
  }

  return Array.from(results.values()).slice(0, 12);
}

export async function getPendingCreatorVerifications(): Promise<CreatorVerificationData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  // Dashboard summary only. The dedicated verification endpoint is paginated.
  const ADMIN_VERIFICATION_PREVIEW_LIMIT = 100;
  const docs = await CreatorProfile.find({
    $or: [
      { verificationStatus: { $in: ["pending", "pending_ownership", "needs_review"] } },
      { statsVerificationStatus: { $in: ["pending", "needs_review"] } },
    ],
  })
    .populate("userId")
    .sort({ updatedAt: -1 })
    .limit(ADMIN_VERIFICATION_PREVIEW_LIMIT)
    .exec();

  return docs
    .filter((doc) => Boolean(doc.userId))
    .map((doc) => mapCreatorVerification(doc as unknown as CreatorVerificationDocument));
}

export async function getPendingBrandVerifications(): Promise<BrandVerificationData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  // Dashboard summary only. The dedicated verification endpoint is paginated.
  const ADMIN_VERIFICATION_PREVIEW_LIMIT = 100;
  const docs = await BrandProfile.find({ verificationStatus: "pending" })
    .populate("userId")
    .sort({ verificationSubmittedAt: -1, updatedAt: -1 })
    .limit(ADMIN_VERIFICATION_PREVIEW_LIMIT)
    .exec();

  return docs
    .filter((doc) => Boolean(doc.userId))
    .map((doc) => mapBrandVerification(doc as unknown as BrandVerificationDocument));
}

export type AdminPageFilters = {
  page?: number;
  limit?: number;
  status?: string;
  verification?: string;
  role?: string;
  event?: string;
  search?: string;
  sort?: string;
  onboarding?: string;
  visibility?: string;
  platform?: string;
  creator?: string;
  brand?: string;
  from?: string;
  to?: string;
  retryable?: string;
};

import { normalizePageRequest, pageResult, type PaginatedResult } from "@/lib/pagination";

export const ADMIN_SEARCH_MAX_LENGTH = 120;

export function normalizeAdminSearch(value?: string) {
  return (value ?? "").trim().slice(0, ADMIN_SEARCH_MAX_LENGTH);
}

export function escapeAdminSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchRegex(value?: string) {
  const normalized = normalizeAdminSearch(value);
  return normalized ? new RegExp(escapeAdminSearch(normalized), "i") : undefined;
}

function allowed(value: string | undefined, values: readonly string[]) {
  return value && values.includes(value) ? value : undefined;
}

function dateRange(filters: AdminPageFilters) {
  const from = filters.from ? new Date(filters.from) : undefined;
  const to = filters.to ? new Date(filters.to) : undefined;
  const validFrom = from && !Number.isNaN(from.getTime()) ? from : undefined;
  const validTo = to && !Number.isNaN(to.getTime()) ? new Date(to.getTime() + 86_400_000 - 1) : undefined;
  return validFrom || validTo ? { ...(validFrom ? { $gte: validFrom } : {}), ...(validTo ? { $lte: validTo } : {}) } : undefined;
}

function facetPage<T>(result: Array<{ data: T[]; metadata: Array<{ total: number }> }>, filters: AdminPageFilters) {
  const total = result[0]?.metadata[0]?.total ?? 0;
  return pageResult(result[0]?.data ?? [], filters, total);
}

function safeFacetWindow(filters: AdminPageFilters) {
  const request = normalizePageRequest(filters, Number.MAX_SAFE_INTEGER);
  return { skip: request.skip, limit: request.limit };
}

export async function getAdminCreatorsPage(filters: AdminPageFilters = {}): Promise<PaginatedResult<AdminCreatorData>> {
  if (!hasMongoUri()) {
    const data = demoCreators.map((creator) => ({
      userId: creator.id, profileId: creator.id, avatar: creator.avatar, name: creator.name,
      username: creator.username, email: `${creator.username}@example.com`,
      verificationStatus: creator.verificationStatus, accountStatus: "active" as const, joinedDate: creator.createdAt,
    }));
    const normalized = normalizePageRequest(filters, data.length);
    return pageResult(data.slice(normalized.skip, normalized.skip + normalized.limit), filters, data.length);
  }
  await connectDB();
  const regex = searchRegex(filters.search);
  const verification = allowed(filters.verification, ["unverified", "pending", "verified", "rejected", "pending_ownership", "ownership_verified", "stats_verified", "needs_review"]);
  const status = allowed(filters.status ?? filters.visibility, ["active", "hidden", "suspended", "deleted"]);
  const platform = allowed(filters.platform, ["youtube", "instagram", "twitch", "x", "other"]);
  const sort = allowed(filters.sort, ["newest", "oldest", "updated", "name_asc", "name_desc"]) ?? "updated";
  const sortStage: Record<string, 1 | -1> =
    sort === "oldest" ? { createdAt: 1, _id: 1 } :
    sort === "newest" ? { createdAt: -1, _id: -1 } :
    sort === "name_asc" ? { "userId.name": 1, _id: 1 } :
    sort === "name_desc" ? { "userId.name": -1, _id: -1 } :
    { updatedAt: -1, _id: -1 };
  const window = safeFacetWindow(filters);
  const match = {
    ...(verification ? { verificationStatus: verification } : {}),
    ...(platform ? { verificationPlatform: platform } : {}),
    ...(status ? { "userId.accountStatus": status } : {}),
    ...(regex ? { $or: [
      { "userId.name": regex }, { "userId.username": regex }, { "userId.email": regex },
      { youtubeHandle: regex }, { youtubeUrl: regex }, { instagramUrl: regex }, { twitterUrl: regex }, { verificationProfileUrl: regex },
    ] } : {}),
  };
  const result = await CreatorProfile.aggregate([
    { $lookup: { from: User.collection.name, localField: "userId", foreignField: "_id", as: "userId" } },
    { $unwind: "$userId" },
    { $match: { "userId.role": "creator", "userId.onboardingComplete": true, ...match } },
    { $sort: sortStage },
    { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: window.skip }, { $limit: window.limit }] } },
  ]).exec();
  const preliminary = facetPage(result as never, filters);
  if (preliminary.page > 0 && preliminary.page !== (filters.page ?? 1)) return getAdminCreatorsPage({ ...filters, page: preliminary.page });
  return { ...preliminary, items: (preliminary.items as unknown as AdminCreatorDocument[]).map(mapAdminCreator) };
}

export async function getAdminBrandsPage(filters: AdminPageFilters = {}): Promise<PaginatedResult<AdminBrandData>> {
  if (!hasMongoUri()) return pageResult([], filters, 0);
  await connectDB();
  const regex = searchRegex(filters.search);
  const verification = allowed(filters.verification, ["unverified", "pending", "verified", "rejected"]);
  const status = allowed(filters.status ?? filters.visibility, ["active", "hidden", "suspended", "deleted"]);
  const sort = allowed(filters.sort, ["newest", "oldest", "updated", "name_asc", "name_desc"]) ?? "updated";
  const sortStage: Record<string, 1 | -1> = sort === "oldest" ? { createdAt: 1, _id: 1 } : sort === "newest" ? { createdAt: -1, _id: -1 } : sort === "name_asc" ? { displayCompanyName: 1, _id: 1 } : sort === "name_desc" ? { displayCompanyName: -1, _id: -1 } : { updatedAt: -1, _id: -1 };
  const window = safeFacetWindow(filters);
  const result = await User.aggregate([
    { $match: { role: "brand" } },
    { $lookup: { from: BrandProfile.collection.name, localField: "_id", foreignField: "userId", as: "profile" } },
    { $set: {
      profile: { $first: "$profile" },
      displayCompanyName: { $ifNull: [{ $first: "$profile.companyName" }, "$name"] },
    } },
    { $match: {
      ...(verification ? { "profile.verificationStatus": verification } : {}),
      ...(status ? { accountStatus: status } : {}),
      ...(regex ? { $or: [{ displayCompanyName: regex }, { "profile.contactEmail": regex }, { "profile.website": regex }, { "profile.companyDomain": regex }, { "profile.normalizedWebsiteDomain": regex }, { name: regex }, { email: regex }, { username: regex }] } : {}),
    } },
    { $sort: sortStage },
    { $facet: {
      metadata: [{ $count: "total" }],
      data: [
        { $skip: window.skip },
        { $limit: window.limit },
        { $lookup: {
          from: BrandInquiry.collection.name,
          let: { brandUserId: "$_id", brandProfileId: "$profile._id" },
          pipeline: [
            { $match: { $expr: { $or: [
              { $eq: ["$brandUserId", "$$brandUserId"] },
              { $and: [
                { $ne: ["$$brandProfileId", null] },
                { $eq: ["$brandProfileId", "$$brandProfileId"] },
              ] },
            ] } } },
            { $count: "total" },
          ],
          as: "collaborationSummary",
        } },
        { $set: { collaborationCount: { $ifNull: [{ $first: "$collaborationSummary.total" }, 0] } } },
      ],
    } },
  ]).exec();
  const preliminary = facetPage(result as never, filters);
  if (preliminary.page > 0 && preliminary.page !== (filters.page ?? 1)) return getAdminBrandsPage({ ...filters, page: preliminary.page });
  return { ...preliminary, items: (preliminary.items as unknown as AdminBrandDocument[]).map(mapAdminBrand) };
}

export async function getAdminCollaborationsPage(filters: AdminPageFilters = {}): Promise<PaginatedResult<AdminCollaborationData>> {
  if (!hasMongoUri()) return pageResult([], filters, 0);
  await connectDB();
  const regex = searchRegex(filters.search);
  const status = filters.status && BRAND_INQUIRY_STATUS_VALUES.includes(filters.status as BrandInquiryStatus) ? filters.status : undefined;
  const range = dateRange(filters);
  const query = {
    ...(status ? { status } : {}),
    ...(filters.creator ? { creatorUsername: searchRegex(filters.creator) } : {}),
    ...(filters.brand ? { companyName: searchRegex(filters.brand) } : {}),
    ...(range ? { createdAt: range } : {}),
    ...(regex ? { $or: [
      { campaignTitle: regex }, { campaignGoal: regex }, { creatorUsername: regex }, { companyName: regex },
      ...(mongoose.isValidObjectId(normalizeAdminSearch(filters.search)) ? [{ _id: new mongoose.Types.ObjectId(normalizeAdminSearch(filters.search)) }] : []),
    ] } : {}),
  };
  const total = await BrandInquiry.countDocuments(query as never);
  const normalized = normalizePageRequest(filters, total);
  const sort = allowed(filters.sort, ["newest", "oldest", "updated"]) ?? "updated";
  const sortStage: Record<string, 1 | -1> = sort === "oldest" ? { createdAt: 1, _id: 1 } : sort === "newest" ? { createdAt: -1, _id: -1 } : { updatedAt: -1, _id: -1 };
  const docs = await BrandInquiry.find(query as never)
    .sort(sortStage)
    .skip(normalized.skip)
    .limit(normalized.limit)
    .exec();
  return pageResult(docs.map((doc) => mapAdminCollaboration(doc as unknown as AdminCollaborationDocument)), filters, total);
}

export async function getAdminEmailLogsPage(filters: AdminPageFilters = {}): Promise<PaginatedResult<AdminEmailLogData>> {
  if (!hasMongoUri()) return pageResult([], filters, 0);
  await connectDB();
  const regex = searchRegex(filters.search);
  const status = allowed(filters.status, ["processing", "sent", "delivered", "delayed", "failed", "permanent_failed", "bounced", "complained", "suppressed", "skipped"]);
  const range = dateRange(filters);
  const query = {
    ...(status ? { status } : {}),
    ...(filters.event ? { event: normalizeAdminSearch(filters.event) } : {}),
    ...(range ? { createdAt: range } : {}),
    ...(regex ? { $or: [{ recipient: regex }, { event: regex }, { deliveryKey: regex }, { providerId: regex }] } : {}),
    ...(filters.retryable === "true" ? { status: "failed", retryable: true } : {}),
  };
  const total = await EmailNotification.countDocuments(query as never);
  const normalized = normalizePageRequest(filters, total);
  const sort = allowed(filters.sort, ["newest", "oldest"]) ?? "newest";
  const docs = await EmailNotification.find(query as never)
    .sort(sort === "oldest" ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 })
    .skip(normalized.skip)
    .limit(normalized.limit)
    .exec();
  return pageResult(docs.map((doc) => mapAdminEmailLog(doc as unknown as AdminEmailNotificationDocument)), filters, total);
}

export async function getAdminUsersPage(filters: AdminPageFilters = {}): Promise<PaginatedResult<AdminUserData>> {
  if (!hasMongoUri()) {
    const data = demoCreators.map((creator) => ({
      userId: creator.id, avatar: creator.avatar, name: creator.name, username: creator.username,
      email: `${creator.username}@example.com`, role: "creator" as const,
      verificationStatus: creator.verificationStatus, accountStatus: "active" as const, joinedDate: creator.createdAt,
    }));
    const normalized = normalizePageRequest(filters, data.length);
    return pageResult(data.slice(normalized.skip, normalized.skip + normalized.limit), filters, data.length);
  }
  await connectDB();
  const regex = searchRegex(filters.search);
  const technicalId = normalizeAdminSearch(filters.search);
  const role = allowed(filters.role, ["creator", "brand"]);
  const status = allowed(filters.status, ["active", "hidden", "suspended", "deleted"]);
  const onboarding = allowed(filters.onboarding, ["complete", "incomplete"]);
  const query = {
    role: role ?? { $in: ["creator", "brand"] },
    ...(status ? { accountStatus: status } : {}),
    ...(onboarding ? { onboardingComplete: onboarding === "complete" } : {}),
    ...(regex ? { $or: [{ name: regex }, { email: regex }, { username: regex }, ...(technicalId.startsWith("user_") ? [{ clerkId: technicalId }] : [])] } : {}),
  };
  const total = await User.countDocuments(query as never);
  const normalized = normalizePageRequest(filters, total);
  const sort = allowed(filters.sort, ["newest", "oldest", "name_asc", "name_desc"]) ?? "newest";
  const sortStage: Record<string, 1 | -1> = sort === "oldest" ? { createdAt: 1, _id: 1 } : sort === "name_asc" ? { name: 1, _id: 1 } : sort === "name_desc" ? { name: -1, _id: -1 } : { createdAt: -1, _id: -1 };
  const users = await User.find(query as never)
    .select("_id username name email avatar role isVerified accountStatus createdAt")
    .sort(sortStage)
    .skip(normalized.skip)
    .limit(normalized.limit)
    .exec();
  const userIds = users.map((user) => user._id);
  const [creatorProfiles, brandProfiles] = await Promise.all([
    CreatorProfile.find({ userId: { $in: userIds } }).select("userId verificationStatus").exec(),
    BrandProfile.find({ userId: { $in: userIds } }).select("userId verificationStatus").exec(),
  ]);
  const creatorStatuses = new Map(creatorProfiles.map((profile) => [profile.userId.toString(), profile.verificationStatus]));
  const brandStatuses = new Map(brandProfiles.map((profile) => [profile.userId.toString(), profile.verificationStatus]));
  const data = users.map((user) => {
    const doc = user as unknown as PopulatedUserDocument;
    const userId = doc._id.toString();
    return {
      userId,
      avatar: doc.avatar ?? "",
      name: doc.name,
      username: doc.username,
      email: doc.email,
      role: doc.role,
      verificationStatus:
        doc.role === "brand"
          ? brandStatuses.get(userId) ?? (doc.isVerified ? "verified" : "unverified")
          : creatorStatuses.get(userId) ?? (doc.isVerified ? "verified" : "unverified"),
      accountStatus: accountStatus(doc),
      joinedDate: doc.createdAt?.toISOString(),
    } satisfies AdminUserData;
  });
  return pageResult(data, filters, total);
}

export async function getAdminContactsPage(filters: AdminPageFilters = {}): Promise<PaginatedResult<AdminContactData>> {
  if (!hasMongoUri()) return pageResult([], filters, 0);
  await connectDB();
  const regex = searchRegex(filters.search);
  const role = allowed(filters.role, ["creator", "brand"]);
  const status = allowed(filters.status, ["active", "hidden", "suspended", "deleted"]);
  const range = dateRange(filters);
  const sort = allowed(filters.sort, ["newest", "oldest", "name_asc", "name_desc"]) ?? "newest";
  const sortStage: Record<string, 1 | -1> = sort === "oldest" ? { updatedAt: 1, _id: 1 } : sort === "name_asc" ? { name: 1, _id: 1 } : sort === "name_desc" ? { name: -1, _id: -1 } : { updatedAt: -1, _id: -1 };
  const window = safeFacetWindow(filters);
  const result = await User.aggregate([
    { $match: {
      role: role ?? { $in: ["creator", "brand"] }, onboardingComplete: true,
      ...(status ? { accountStatus: status } : {}), ...(range ? { updatedAt: range } : {}),
    } },
    { $lookup: { from: BrandProfile.collection.name, localField: "_id", foreignField: "userId", as: "brandProfile" } },
    { $lookup: { from: CreatorProfile.collection.name, localField: "_id", foreignField: "userId", as: "creatorProfile" } },
    { $set: { brandProfile: { $first: "$brandProfile" }, creatorProfile: { $first: "$creatorProfile" } } },
    ...(regex ? [{ $match: { $or: [
      { name: regex }, { email: regex }, { username: regex },
      { "brandProfile.companyName": regex }, { "brandProfile.contactName": regex }, { "brandProfile.contactEmail": regex },
    ] } }] : []),
    { $sort: sortStage },
    { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: window.skip }, { $limit: window.limit }] } },
  ]).exec();
  const preliminary = facetPage(result as never, filters);
  if (preliminary.page > 0 && preliminary.page !== (filters.page ?? 1)) return getAdminContactsPage({ ...filters, page: preliminary.page });
  const data = (preliminary.items as Array<AdminContactUserDocument & { brandProfile?: AdminBrandContactProfileDocument; creatorProfile?: AdminCreatorContactProfileDocument }>).map((doc) => {
    const userId = doc._id.toString();
    const creator = doc.creatorProfile;
    const brand = doc.brandProfile;
    return {
      userId,
      username: doc.username,
      role: doc.role,
      displayName: doc.name,
      accountEmail: doc.email,
      contactName: brand?.contactName,
      contactEmail: brand?.contactEmail,
      contactRole: brand?.contactRole,
      companyName: brand?.companyName,
      phoneNumber: doc.phoneNumber,
      phoneVerified: Boolean(doc.phoneVerified),
      profileStatus: brand?.verificationStatus ?? creator?.verificationStatus,
      country: brand?.country ?? creator?.country,
      updatedAt: doc.updatedAt?.toISOString(),
    } satisfies AdminContactData;
  });
  return { ...preliminary, items: data };
}
