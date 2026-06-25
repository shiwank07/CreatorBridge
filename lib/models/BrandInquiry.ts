import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IBrandInquiry extends Document {
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
  createdByClerkId?: string;
  status: "new" | "reviewed" | "contacted" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const BrandInquirySchema = new Schema<IBrandInquiry>(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    website: { type: String, default: "" },
    campaignGoal: { type: String, required: true, maxlength: 1000 },
    targetNiches: [{ type: String }],
    targetPlatforms: [{ type: String }],
    budgetRange: { type: String, required: true },
    timeline: { type: String, required: true },
    message: { type: String, default: "", maxlength: 1500 },
    creatorUsername: { type: String, default: "" },
    createdByClerkId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "reviewed", "contacted", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

export const BrandInquiry =
  (mongoose.models.BrandInquiry as Model<IBrandInquiry> | undefined) ??
  mongoose.model<IBrandInquiry>("BrandInquiry", BrandInquirySchema);
