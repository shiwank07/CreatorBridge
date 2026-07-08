import mongoose, { type Document, type Model, Schema } from "mongoose";

import { CREATOR_AVAILABILITY_STATUSES, type CreatorAvailabilityStatus } from "@/lib/availability";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"
  | "pending_ownership"
  | "ownership_verified"
  | "stats_verified"
  | "needs_review";
export type StatsVerificationStatus = "unverified" | "pending" | "verified" | "needs_review" | "rejected";
export type CreatorVerificationPlatform = "youtube" | "instagram" | "twitch" | "other";

export interface ICreatorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  phoneVerifiedAt?: Date | null;
  niche: string[];
  country?: string;
  languages: string[];
  youtubeUrl?: string;
  youtubeHandle?: string;
  subscribers?: number;
  verificationStatus: VerificationStatus;
  statsVerificationStatus: StatsVerificationStatus;
  claimedSubscribers?: number;
  verifiedSubscribers?: number;
  claimedAverageViews?: number;
  verifiedAverageViews?: number;
  claimedEngagementRate?: number;
  verifiedEngagementRate?: number;
  verificationCode?: string;
  verificationPlatform?: CreatorVerificationPlatform;
  verificationProfileUrl?: string;
  verificationSubmittedNote?: string;
  verificationNote?: string;
  verificationSubmittedAt?: Date | null;
  verificationReviewedAt?: Date | null;
  verificationReviewedByAdminId?: string;
  verificationRejectedReason?: string;
  verificationCodeExpiresAt?: Date | null;
  normalizedYoutubeChannelKey?: string;
  lastVerifiedAt?: Date | null;
  verifiedAt?: Date | null;
  avgViews?: number;
  totalVideos?: number;
  instagramUrl?: string;
  instagramFollowers?: number;
  twitterUrl?: string;
  twitterFollowers?: number;
  podcastUrl?: string;
  sponsorshipRate?: number;
  rateNegotiable: boolean;
  rateType?: "per_video" | "per_post" | "per_campaign";
  pastBrands: string[];
  sampleWorkUrls: string[];
  isOpenToDeals: boolean;
  availabilityStatus: CreatorAvailabilityStatus;
  upiId?: string;
  paypalEmail?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  ifsc?: string;
  preferredPaymentNote?: string;
  profileViews: number;
  completedCampaigns: number;
  totalDeals: number;
  createdAt: Date;
  updatedAt: Date;
}

const CreatorProfileSchema = new Schema<ICreatorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    bio: { type: String, maxlength: 500, default: "" },
    phoneNumber: { type: String, trim: true, default: "" },
    phoneVerified: { type: Boolean, default: false, index: true },
    phoneVerifiedAt: { type: Date, default: null },
    niche: [{ type: String, index: true }],
    country: { type: String, default: "" },
    languages: [{ type: String }],
    youtubeUrl: { type: String, default: "" },
    youtubeHandle: { type: String, default: "" },
    subscribers: { type: Number, default: 0, min: 0 },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected", "pending_ownership", "ownership_verified", "stats_verified", "needs_review"],
      default: "unverified",
      index: true,
    },
    statsVerificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "needs_review", "rejected"],
      default: "unverified",
      index: true,
    },
    claimedSubscribers: { type: Number, default: 0, min: 0 },
    verifiedSubscribers: { type: Number, default: 0, min: 0 },
    claimedAverageViews: { type: Number, default: 0, min: 0 },
    verifiedAverageViews: { type: Number, default: 0, min: 0 },
    claimedEngagementRate: { type: Number, default: 0, min: 0 },
    verifiedEngagementRate: { type: Number, default: 0, min: 0 },
    verificationCode: { type: String, default: "" },
    verificationPlatform: { type: String, enum: ["youtube", "instagram", "twitch", "other"], default: "youtube" },
    verificationProfileUrl: { type: String, trim: true, default: "" },
    verificationSubmittedNote: { type: String, trim: true, maxlength: 500, default: "" },
    verificationNote: { type: String, maxlength: 500, default: "" },
    verificationSubmittedAt: { type: Date, default: null },
    verificationReviewedAt: { type: Date, default: null },
    verificationReviewedByAdminId: { type: String, default: "" },
    verificationRejectedReason: { type: String, maxlength: 500, default: "" },
    verificationCodeExpiresAt: { type: Date, default: null },
    normalizedYoutubeChannelKey: { type: String, default: "", index: true },
    lastVerifiedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    avgViews: { type: Number, default: 0, min: 0 },
    totalVideos: { type: Number, default: 0, min: 0 },
    instagramUrl: { type: String, default: "" },
    instagramFollowers: { type: Number, default: 0, min: 0 },
    twitterUrl: { type: String, default: "" },
    twitterFollowers: { type: Number, default: 0, min: 0 },
    podcastUrl: { type: String, default: "" },
    sponsorshipRate: { type: Number, default: 0, min: 0 },
    rateNegotiable: { type: Boolean, default: true },
    rateType: { type: String, enum: ["per_video", "per_post", "per_campaign"], default: "per_video" },
    pastBrands: [{ type: String }],
    sampleWorkUrls: [{ type: String }],
    isOpenToDeals: { type: Boolean, default: true },
    availabilityStatus: {
      type: String,
      enum: CREATOR_AVAILABILITY_STATUSES,
      default: "open_to_deals",
      index: true,
    },
    upiId: { type: String, trim: true, maxlength: 120, default: "" },
    paypalEmail: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
    bankAccountName: { type: String, trim: true, maxlength: 120, default: "" },
    bankAccountNumber: { type: String, trim: true, maxlength: 40, default: "" },
    ifsc: { type: String, trim: true, uppercase: true, maxlength: 20, default: "" },
    preferredPaymentNote: { type: String, trim: true, maxlength: 500, default: "" },
    profileViews: { type: Number, default: 0, min: 0 },
    completedCampaigns: { type: Number, default: 0, min: 0 },
    totalDeals: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

CreatorProfileSchema.index(
  { verificationCode: 1 },
  {
    unique: true,
    partialFilterExpression: { verificationCode: { $type: "string", $ne: "" } },
  },
);

export const CreatorProfile =
  (mongoose.models.CreatorProfile as Model<ICreatorProfile> | undefined) ??
  mongoose.model<ICreatorProfile>("CreatorProfile", CreatorProfileSchema);
