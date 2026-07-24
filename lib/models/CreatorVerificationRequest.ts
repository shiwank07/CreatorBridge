import mongoose, { type Document, type Model, Schema } from "mongoose";

export const CREATOR_VERIFICATION_PLATFORMS = ["youtube", "instagram", "twitch", "x", "other"] as const;
export const CREATOR_VERIFICATION_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;

export type CreatorVerificationRequestPlatform = (typeof CREATOR_VERIFICATION_PLATFORMS)[number];
export type CreatorVerificationRequestStatus = (typeof CREATOR_VERIFICATION_REQUEST_STATUSES)[number];

export interface ICreatorVerificationRequest extends Document {
  creatorId: mongoose.Types.ObjectId;
  clerkUserId: string;
  platform: CreatorVerificationRequestPlatform;
  customPlatformName?: string;
  profileUrl: string;
  verificationCode: string;
  creatorNote?: string;
  status: CreatorVerificationRequestStatus;
  adminNote?: string;
  reviewedBy?: string;
  submittedAt: Date;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CreatorVerificationRequestSchema = new Schema<ICreatorVerificationRequest>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
    clerkUserId: { type: String, required: true, trim: true, index: true },
    platform: { type: String, enum: CREATOR_VERIFICATION_PLATFORMS, required: true },
    customPlatformName: { type: String, trim: true, maxlength: 80, default: "" },
    profileUrl: { type: String, required: true, trim: true, maxlength: 500 },
    verificationCode: { type: String, required: true, trim: true },
    creatorNote: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: CREATOR_VERIFICATION_REQUEST_STATUSES, required: true, default: "pending", index: true },
    adminNote: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedBy: { type: String, trim: true, default: "" },
    submittedAt: { type: Date, required: true, default: Date.now, index: true },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CreatorVerificationRequestSchema.index({ creatorId: 1, submittedAt: -1 });
CreatorVerificationRequestSchema.index({ status: 1, submittedAt: -1 });
CreatorVerificationRequestSchema.index(
  { creatorId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export const CreatorVerificationRequest =
  (mongoose.models.CreatorVerificationRequest as Model<ICreatorVerificationRequest> | undefined) ??
  mongoose.model<ICreatorVerificationRequest>("CreatorVerificationRequest", CreatorVerificationRequestSchema);
