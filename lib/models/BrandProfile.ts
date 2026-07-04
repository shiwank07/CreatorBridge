import mongoose, { type Document, type Model, Schema } from "mongoose";

export type BrandVerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type BrandVerificationMethod = "work_email_domain" | "website_code" | "manual";

export interface IBrandProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  website?: string;
  industry: string;
  companySize?: string;
  country?: string;
  notes?: string;
  companyRegistrationText?: string;
  verificationStatus: BrandVerificationStatus;
  companyDomain?: string;
  normalizedWebsiteDomain?: string;
  verificationMethod: BrandVerificationMethod;
  verificationCode?: string;
  verificationSubmittedAt?: Date | null;
  verificationReviewedAt?: Date | null;
  verificationReviewedByAdminId?: string;
  verificationNote?: string;
  rejectionReason?: string;
  completedCampaigns: number;
  createdAt: Date;
  updatedAt: Date;
}

const BrandProfileSchema = new Schema<IBrandProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
    contactName: { type: String, required: true, trim: true, maxlength: 100 },
    contactRole: { type: String, trim: true, maxlength: 100, default: "" },
    contactEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
    phoneNumber: { type: String, trim: true, default: "" },
    phoneVerified: { type: Boolean, default: false, index: true },
    website: { type: String, trim: true, default: "" },
    industry: { type: String, required: true, trim: true, maxlength: 80, index: true },
    companySize: { type: String, trim: true, maxlength: 80, default: "" },
    country: { type: String, trim: true, maxlength: 80, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    companyRegistrationText: { type: String, trim: true, maxlength: 500, default: "" },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
      index: true,
    },
    companyDomain: { type: String, trim: true, lowercase: true, default: "", index: true },
    normalizedWebsiteDomain: { type: String, trim: true, lowercase: true, default: "", index: true },
    verificationMethod: {
      type: String,
      enum: ["work_email_domain", "website_code", "manual"],
      default: "manual",
    },
    verificationCode: { type: String, trim: true, default: "" },
    verificationSubmittedAt: { type: Date, default: null },
    verificationReviewedAt: { type: Date, default: null },
    verificationReviewedByAdminId: { type: String, default: "" },
    verificationNote: { type: String, trim: true, maxlength: 500, default: "" },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: "" },
    completedCampaigns: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

BrandProfileSchema.index({ companyName: 1 });
BrandProfileSchema.index(
  { verificationCode: 1 },
  {
    unique: true,
    partialFilterExpression: { verificationCode: { $type: "string", $ne: "" } },
  },
);

export const BrandProfile =
  (mongoose.models.BrandProfile as Model<IBrandProfile> | undefined) ??
  mongoose.model<IBrandProfile>("BrandProfile", BrandProfileSchema);
