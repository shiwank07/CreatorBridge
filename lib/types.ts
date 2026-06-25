export type Role = "creator" | "brand" | "agency" | "talent";
export type VerificationStatus = "unverified" | "ownership_verified" | "stats_verified" | "rejected";

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
  lastVerifiedAt?: string;
  createdAt?: string;
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
  status: "new" | "reviewed" | "contacted" | "closed";
  createdAt?: string;
};
