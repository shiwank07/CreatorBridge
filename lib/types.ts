export type Role = "creator" | "brand" | "agency" | "talent";
export type VerificationStatus = "unverified" | "pending_ownership" | "ownership_verified" | "stats_verified" | "rejected";
export type BrandVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

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
  website?: string;
  industry: string;
  companySize?: string;
  country?: string;
  verificationStatus: BrandVerificationStatus;
  verificationNote?: string;
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

export type BrandInquiryData = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  website?: string;
  campaignGoal: string;
  targetNiches: string[];
  targetPlatforms: string[];
  budgetRange: string;
  timeline: string;
  message?: string;
  creatorUsername?: string;
  status: "new" | "reviewed" | "contacted" | "sent_to_creator" | "creator_interested" | "creator_declined" | "rejected" | "closed";
  createdAt?: string;
};
