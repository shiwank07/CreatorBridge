import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { EmailNotification } from "@/lib/models/EmailNotification";
import { User } from "@/lib/models/User";
import {
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
  userId: PopulatedUserDocument;
  companyName: string;
  contactEmail?: string;
  verificationStatus?: BrandVerificationData["verificationStatus"];
  createdAt?: Date;
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
  error?: string | null;
  createdAt?: Date;
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
  const user = doc.userId;

  return {
    userId: user._id.toString(),
    profileId: doc._id.toString(),
    logo: user.avatar ?? "",
    companyName: doc.companyName,
    username: user.username,
    email: doc.contactEmail || user.email,
    verificationStatus: doc.verificationStatus ?? (user.isVerified ? "verified" : "unverified"),
    accountStatus: accountStatus(user),
    joinedDate: user.createdAt?.toISOString() ?? doc.createdAt?.toISOString(),
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
    error: doc.error,
    createdAt: doc.createdAt?.toISOString(),
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
    BrandProfile.countDocuments(),
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

export async function getAdminCreators(): Promise<AdminCreatorData[]> {
  if (!hasMongoUri()) {
    return demoCreators.map((creator) => ({
      userId: creator.id,
      profileId: creator.id,
      avatar: creator.avatar,
      name: creator.name,
      username: creator.username,
      email: `${creator.username}@example.com`,
      verificationStatus: creator.verificationStatus,
      accountStatus: "active",
      joinedDate: creator.createdAt,
    }));
  }

  await connectDB();
  const docs = await CreatorProfile.find({})
    .populate({ path: "userId", match: { role: "creator", onboardingComplete: true } })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(200)
    .exec();

  return docs
    .filter((doc) => Boolean(doc.userId))
    .map((doc) => mapAdminCreator(doc as unknown as AdminCreatorDocument));
}

export async function getAdminInquiries(): Promise<BrandInquiryData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const docs = await BrandInquiry.find({}).sort({ createdAt: -1 }).limit(100).exec();
  return docs.map((doc) => mapInquiry(doc as unknown as InquiryDocument));
}

export async function getAdminInquiryById(id: string): Promise<BrandInquiryData | null> {
  if (!hasMongoUri()) return null;

  await connectDB();
  const doc = await BrandInquiry.findById(id).exec();
  return doc ? mapInquiry(doc as unknown as InquiryDocument) : null;
}

export async function getAdminBrands(): Promise<AdminBrandData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const docs = await BrandProfile.find({})
    .populate({ path: "userId", match: { role: "brand", onboardingComplete: true } })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(200)
    .exec();

  return docs
    .filter((doc) => Boolean(doc.userId))
    .map((doc) => mapAdminBrand(doc as unknown as AdminBrandDocument));
}

export async function getAdminCollaborations(): Promise<AdminCollaborationData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const docs = await BrandInquiry.find({}).sort({ updatedAt: -1, createdAt: -1 }).limit(200).exec();
  return docs.map((doc) => mapAdminCollaboration(doc as unknown as AdminCollaborationDocument));
}

export async function getAdminReports(): Promise<AdminReportData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const docs = await BrandInquiry.find({ "deliveryProof.issueReportedAt": { $ne: null } })
    .sort({ "deliveryProof.issueReportedAt": -1, updatedAt: -1 })
    .limit(200)
    .exec();

  return docs.map((doc) => mapAdminReport(doc as unknown as AdminReportDocument));
}

export async function getAdminEmailLogs(): Promise<AdminEmailLogData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const docs = await EmailNotification.find({}).sort({ createdAt: -1 }).limit(200).exec();
  return docs.map((doc) => mapAdminEmailLog(doc as unknown as AdminEmailNotificationDocument));
}

export async function getAdminUsers(): Promise<AdminUserData[]> {
  if (!hasMongoUri()) {
    return demoCreators.map((creator) => ({
      userId: creator.id,
      avatar: creator.avatar,
      name: creator.name,
      username: creator.username,
      email: `${creator.username}@example.com`,
      role: "creator",
      verificationStatus: creator.verificationStatus,
      accountStatus: "active",
      joinedDate: creator.createdAt,
    }));
  }

  await connectDB();
  const users = await User.find({ role: { $in: ["creator", "brand"] } })
    .select("_id username name email avatar role isVerified accountStatus createdAt")
    .sort({ createdAt: -1 })
    .limit(300)
    .exec();

  const userIds = users.map((user) => user._id);
  const [creatorProfiles, brandProfiles] = await Promise.all([
    CreatorProfile.find({ userId: { $in: userIds } }).select("userId verificationStatus").exec(),
    BrandProfile.find({ userId: { $in: userIds } }).select("userId verificationStatus").exec(),
  ]);

  const creatorStatusByUserId = new Map(
    creatorProfiles.map((profile) => {
      const doc = profile as unknown as { userId: { toString(): string }; verificationStatus?: VerificationStatus };
      return [doc.userId.toString(), doc.verificationStatus ?? "unverified"];
    }),
  );
  const brandStatusByUserId = new Map(
    brandProfiles.map((profile) => {
      const doc = profile as unknown as { userId: { toString(): string }; verificationStatus?: BrandVerificationData["verificationStatus"] };
      return [doc.userId.toString(), doc.verificationStatus ?? "unverified"];
    }),
  );

  return users.map((user) => {
    const doc = user as unknown as PopulatedUserDocument;
    const userId = doc._id.toString();
    const profileStatus =
      doc.role === "brand"
        ? brandStatusByUserId.get(userId) ?? (doc.isVerified ? "verified" : "unverified")
        : creatorStatusByUserId.get(userId) ?? (doc.isVerified ? "verified" : "unverified");

    return {
      userId,
      avatar: doc.avatar ?? "",
      name: doc.name,
      username: doc.username,
      email: doc.email,
      role: doc.role,
      verificationStatus: profileStatus,
      accountStatus: accountStatus(doc),
      joinedDate: doc.createdAt?.toISOString(),
    };
  });
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
    const doc = brand as unknown as AdminBrandDocument;
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
  const docs = await CreatorProfile.find({
    $or: [
      { verificationStatus: { $in: ["pending", "pending_ownership", "needs_review"] } },
      { statsVerificationStatus: { $in: ["pending", "needs_review"] } },
    ],
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

export async function getAdminContactDetails(): Promise<AdminContactData[]> {
  if (!hasMongoUri()) return [];

  await connectDB();
  const users = await User.find({ role: { $in: ["creator", "brand"] }, onboardingComplete: true })
    .select("username name email phoneNumber phoneVerified role updatedAt")
    .sort({ updatedAt: -1 })
    .limit(200)
    .exec();

  const userIds = users.map((user) => user._id);
  const [creatorProfiles, brandProfiles] = await Promise.all([
    CreatorProfile.find({ userId: { $in: userIds } }).select("userId country verificationStatus").exec(),
    BrandProfile.find({ userId: { $in: userIds } })
      .select("userId companyName contactName contactRole contactEmail country verificationStatus")
      .exec(),
  ]);

  const creatorProfileByUserId = new Map(
    creatorProfiles.map((profile) => {
      const doc = profile as unknown as AdminCreatorContactProfileDocument;
      return [doc.userId.toString(), doc];
    }),
  );
  const brandProfileByUserId = new Map(
    brandProfiles.map((profile) => {
      const doc = profile as unknown as AdminBrandContactProfileDocument;
      return [doc.userId.toString(), doc];
    }),
  );

  return users.map((user) => {
    const doc = user as unknown as AdminContactUserDocument;
    const userId = doc._id.toString();
    const creatorProfile = creatorProfileByUserId.get(userId);
    const brandProfile = brandProfileByUserId.get(userId);

    return {
      userId,
      username: doc.username,
      role: doc.role,
      displayName: doc.name,
      accountEmail: doc.email,
      contactName: brandProfile?.contactName,
      contactEmail: brandProfile?.contactEmail,
      contactRole: brandProfile?.contactRole,
      companyName: brandProfile?.companyName,
      phoneNumber: doc.phoneNumber,
      phoneVerified: Boolean(doc.phoneVerified),
      profileStatus: brandProfile?.verificationStatus ?? creatorProfile?.verificationStatus,
      country: brandProfile?.country ?? creatorProfile?.country,
      updatedAt: doc.updatedAt?.toISOString(),
    };
  });
}
