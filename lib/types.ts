export type Role = "creator" | "brand" | "agency" | "talent";
export type AccountStatus = "active" | "hidden" | "suspended";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected" | "pending_ownership" | "ownership_verified" | "stats_verified";
export type BrandVerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type CreatorVerificationPlatform = "youtube" | "instagram" | "twitch" | "other";
export type CollaborationStatus =
  | "NEW"
  | "PENDING_CREATOR_RESPONSE"
  | "ACCEPTED"
  | "DECLINED"
  | "IN_PROGRESS"
  | "PROOF_SUBMITTED"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED";
export type CollaborationTimelineEvent =
  | "CREATED"
  | "VIEWED"
  | "ACCEPTED"
  | "DECLINED"
  | "IN_PROGRESS"
  | "PROOF_SUBMITTED"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED";

export type CreatorCardData = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  niche: string[];
  country?: string;
  languages: string[];
  youtubeUrl?: string;
  instagramUrl?: string;
  podcastUrl?: string;
  subscribers?: number;
  claimedSubscribers?: number;
  verifiedSubscribers?: number;
  verificationStatus: VerificationStatus;
  verificationCode?: string;
  verificationPlatform?: CreatorVerificationPlatform;
  verificationProfileUrl?: string;
  avgViews?: number;
  instagramFollowers?: number;
  sponsorshipRate?: number;
  rateType?: "per_video" | "per_post" | "per_campaign";
  pastBrands: string[];
  sampleWorkUrls: string[];
  isOpenToDeals: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
};

export type CreatorVerificationData = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  youtubeUrl?: string;
  youtubeHandle?: string;
  claimedSubscribers?: number;
  verifiedSubscribers?: number;
  verificationStatus: VerificationStatus;
  verificationCode?: string;
  verificationPlatform?: CreatorVerificationPlatform;
  verificationProfileUrl?: string;
  verificationSubmittedNote?: string;
  verificationNote?: string;
  verificationRejectedReason?: string;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  verificationCodeExpiresAt?: string;
  lastVerifiedAt?: string;
  phoneVerified?: boolean;
  createdAt?: string;
};

export type BrandProfileData = {
  id: string;
  username: string;
  avatar?: string;
  companyName: string;
  contactName: string;
  contactRole?: string;
  contactEmail?: string;
  website?: string;
  industry: string;
  companySize?: string;
  country?: string;
  notes?: string;
  verificationStatus: BrandVerificationStatus;
  verificationNote?: string;
  companyRegistrationText?: string;
  phoneVerified?: boolean;
  createdAt?: string;
};

export type BrandVerificationData = BrandProfileData & {
  contactEmail: string;
  companyDomain?: string;
  normalizedWebsiteDomain?: string;
  verificationMethod: "work_email_domain" | "website_code" | "manual";
  verificationCode?: string;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  rejectionReason?: string;
};

export type OfferHistoryEntryData = {
  id?: string;
  actor: "brand" | "creator";
  action: "offer_sent" | "counter_requested" | "counter_sent" | "offer_accepted" | "offer_declined";
  amount?: number;
  currency: "INR";
  note?: string;
  createdAt?: string;
};

export type CollaborationTimelineEntryData = {
  id?: string;
  event: CollaborationTimelineEvent;
  status: CollaborationStatus;
  actor: "brand" | "creator" | "admin" | "system";
  note?: string;
  createdAt?: string;
};

export type BrandInquiryData = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  contactEmailRevealed?: boolean;
  brandContactEmail?: string;
  creatorContactEmail?: string;
  website?: string;
  campaignGoal: string;
  deliverables: string[];
  targetNiches: string[];
  targetPlatforms: string[];
  budgetRange: string;
  initialOfferAmount?: number;
  currentOfferAmount?: number;
  currency: "INR";
  isNegotiable: boolean;
  offerHistory: OfferHistoryEntryData[];
  timeline: string;
  message?: string;
  creatorUsername?: string;
  creatorResponseAt?: string;
  creatorResponseNote?: string;
  status: CollaborationStatus;
  statusHistory: CollaborationTimelineEntryData[];
  deliveryProof?: {
    videoUrl?: string;
    timestampStart?: string;
    timestampEnd?: string;
    notes?: string;
    screenshotUrl?: string;
    referenceLink?: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewNote?: string;
    issueNote?: string;
    issueReportedAt?: string;
  };
  createdAt?: string;
};

export type InAppNotificationData = {
  id: string;
  event: string;
  title: string;
  message: string;
  href: string;
  isRead: boolean;
  readAt: string | null;
  createdAt?: string;
};

export type AdminContactData = {
  userId: string;
  username: string;
  role: Extract<Role, "creator" | "brand">;
  displayName: string;
  accountEmail: string;
  contactName?: string;
  contactEmail?: string;
  contactRole?: string;
  companyName?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  profileStatus?: VerificationStatus | BrandVerificationStatus;
  country?: string;
  updatedAt?: string;
};

export type AdminCreatorData = {
  userId: string;
  profileId: string;
  avatar: string;
  name: string;
  username: string;
  email: string;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  joinedDate?: string;
};

export type AdminBrandData = {
  userId: string;
  profileId: string;
  logo: string;
  companyName: string;
  username: string;
  email: string;
  verificationStatus: BrandVerificationStatus;
  accountStatus: AccountStatus;
  joinedDate?: string;
};

export type AdminCollaborationData = {
  id: string;
  brand: string;
  brandEmail: string;
  creator: string;
  status: CollaborationStatus;
  budget: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminReportStatus = "open" | "resolved" | "dismissed";

export type AdminReportData = {
  id: string;
  reporter: string;
  reportedUser: string;
  reportedUsername?: string;
  reason: string;
  status: AdminReportStatus;
  createdAt?: string;
};

export type AdminEmailLogData = {
  id: string;
  recipient: string;
  event: string;
  status: "sent" | "failed" | "skipped";
  error?: string | null;
  createdAt?: string;
};

export type AdminUserData = {
  userId: string;
  avatar: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  verificationStatus: VerificationStatus | BrandVerificationStatus;
  accountStatus: AccountStatus;
  joinedDate?: string;
};

export type AdminSearchResultData = {
  id: string;
  type: "user" | "creator" | "brand";
  title: string;
  subtitle: string;
  href: string;
  status: AccountStatus | VerificationStatus | BrandVerificationStatus;
};
