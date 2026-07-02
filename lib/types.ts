export type Role = "creator" | "brand" | "agency" | "talent";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected" | "pending_ownership" | "ownership_verified" | "stats_verified";
export type BrandVerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type CreatorVerificationPlatform = "youtube" | "instagram" | "twitch" | "other";

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
  createdAt?: string;
};

export type BrandProfileData = {
  id: string;
  username: string;
  companyName: string;
  contactName: string;
  contactRole?: string;
  contactEmail?: string;
  website?: string;
  industry: string;
  companySize?: string;
  country?: string;
  verificationStatus: BrandVerificationStatus;
  verificationNote?: string;
  companyRegistrationText?: string;
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

export type BrandInquiryData = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
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
  status:
    | "new"
    | "viewed"
    | "offer_sent"
    | "counter_requested"
    | "counter_sent"
    | "offer_accepted"
    | "offer_declined"
    | "interested"
    | "work_started"
    | "proof_submitted"
    | "changes_requested"
    | "approved"
    | "completed"
    | "closed";
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
