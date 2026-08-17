import mongoose, { type Document, type Model, Schema } from "mongoose";
import { PLATFORM_KINDS, type PlatformKind } from "@/lib/creator-platforms";

export const CREATOR_VERIFICATION_PLATFORMS = PLATFORM_KINDS;
export const CREATOR_VERIFICATION_REQUEST_STATUSES = ["generated", "pending", "approved", "rejected", "expired", "revoked"] as const;

export type CreatorVerificationRequestPlatform = (typeof CREATOR_VERIFICATION_PLATFORMS)[number];
export type CreatorVerificationRequestStatus = (typeof CREATOR_VERIFICATION_REQUEST_STATUSES)[number];

export interface ICreatorVerificationRequest extends Document {
  creatorId: mongoose.Types.ObjectId;
  platformAccountId: string;
  clerkUserId: string;
  platform: PlatformKind;
  customPlatformName?: string;
  profileUrl: string;
  codeHash: string;
  codeSalt: string;
  codeExpiresAt: Date;
  generatedAt: Date;
  consumedAt?: Date | null;
  generation: number;
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
    platformAccountId: { type: String, required: true, trim: true, maxlength: 80, index: true },
    clerkUserId: { type: String, required: true, trim: true, index: true },
    platform: { type: String, enum: CREATOR_VERIFICATION_PLATFORMS, required: true },
    customPlatformName: { type: String, trim: true, maxlength: 80, default: "" },
    profileUrl: { type: String, required: true, trim: true, maxlength: 500 },
    codeHash: { type: String, required: true, select: false },
    codeSalt: { type: String, required: true, select: false },
    codeExpiresAt: { type: Date, required: true, index: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    consumedAt: { type: Date, default: null },
    generation: { type: Number, min: 1, required: true, default: 1 },
    creatorNote: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: CREATOR_VERIFICATION_REQUEST_STATUSES, required: true, default: "pending", index: true },
    adminNote: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedBy: { type: String, trim: true, default: "" },
    submittedAt: { type: Date, default: null, index: true },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CreatorVerificationRequestSchema.index({ creatorId: 1, platformAccountId: 1, submittedAt: -1 });
CreatorVerificationRequestSchema.index({ status: 1, submittedAt: -1 });
CreatorVerificationRequestSchema.index(
  { creatorId: 1, platformAccountId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["generated", "pending"] } } },
);

export const CreatorVerificationRequest =
  (mongoose.models.CreatorVerificationRequest as Model<ICreatorVerificationRequest> | undefined) ??
  mongoose.model<ICreatorVerificationRequest>("CreatorVerificationRequest", CreatorVerificationRequestSchema);
