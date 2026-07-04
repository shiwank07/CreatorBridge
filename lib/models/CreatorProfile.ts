import mongoose, { type Document, type Model, Schema } from "mongoose";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected" | "pending_ownership" | "ownership_verified" | "stats_verified";
export type CreatorVerificationPlatform = "youtube" | "instagram" | "twitch" | "other";

export interface ICreatorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  niche: string[];
  country?: string;
  languages: string[];
  youtubeUrl?: string;
  youtubeHandle?: string;
  subscribers?: number;
  verificationStatus: VerificationStatus;
  claimedSubscribers?: number;
  verifiedSubscribers?: number;
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
    niche: [{ type: String, index: true }],
    country: { type: String, default: "" },
    languages: [{ type: String }],
    youtubeUrl: { type: String, default: "" },
    youtubeHandle: { type: String, default: "" },
    subscribers: { type: Number, default: 0, min: 0 },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected", "pending_ownership", "ownership_verified", "stats_verified"],
      default: "unverified",
      index: true,
    },
    claimedSubscribers: { type: Number, default: 0, min: 0 },
    verifiedSubscribers: { type: Number, default: 0, min: 0 },
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
