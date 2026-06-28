import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IBrandInquiry extends Document {
  brandUserId?: mongoose.Types.ObjectId;
  brandProfileId?: mongoose.Types.ObjectId;
  creatorUserId?: mongoose.Types.ObjectId;
  creatorProfileId?: mongoose.Types.ObjectId;
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
  source: "general_form" | "creator_profile";
  status: "new" | "reviewed" | "contacted" | "sent_to_creator" | "creator_interested" | "creator_declined" | "rejected" | "closed";
  adminOwnerId?: string;
  adminNote?: string;
  reviewedAt?: Date | null;
  sentToCreatorAt?: Date | null;
  creatorResponseAt?: Date | null;
  creatorResponseNote?: string;
  closedAt?: Date | null;
  ipHash?: string;
  userAgentHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandInquirySchema = new Schema<IBrandInquiry>(
  {
    brandUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    brandProfileId: { type: Schema.Types.ObjectId, ref: "BrandProfile", default: null, index: true },
    creatorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    creatorProfileId: { type: Schema.Types.ObjectId, ref: "CreatorProfile", default: null, index: true },
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
    source: { type: String, enum: ["general_form", "creator_profile"], default: "general_form", index: true },
    status: {
      type: String,
      enum: ["new", "reviewed", "contacted", "sent_to_creator", "creator_interested", "creator_declined", "rejected", "closed"],
      default: "new",
      index: true,
    },
    adminOwnerId: { type: String, default: "" },
    adminNote: { type: String, maxlength: 1000, default: "" },
    reviewedAt: { type: Date, default: null },
    sentToCreatorAt: { type: Date, default: null },
    creatorResponseAt: { type: Date, default: null },
    creatorResponseNote: { type: String, maxlength: 1000, default: "" },
    closedAt: { type: Date, default: null },
    ipHash: { type: String, default: "" },
    userAgentHash: { type: String, default: "" },
  },
  { timestamps: true },
);

export const BrandInquiry =
  (mongoose.models.BrandInquiry as Model<IBrandInquiry> | undefined) ??
  mongoose.model<IBrandInquiry>("BrandInquiry", BrandInquirySchema);
