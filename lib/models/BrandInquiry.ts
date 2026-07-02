import mongoose, { type Document, type Model, Schema } from "mongoose";

import { BRAND_INQUIRY_STATUS_VALUES, type BrandInquiryStatus } from "@/lib/collaborations";

type OfferHistoryAction = "offer_sent" | "counter_requested" | "counter_sent" | "offer_accepted" | "offer_declined";

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
  deliverables: string[];
  targetNiches: string[];
  targetPlatforms: string[];
  budgetRange: string;
  initialOfferAmount?: number;
  currentOfferAmount?: number;
  currency: "INR";
  isNegotiable: boolean;
  offerHistory: {
    _id?: mongoose.Types.ObjectId;
    actor: "brand" | "creator";
    action: OfferHistoryAction;
    amount?: number;
    currency: "INR";
    note?: string;
    createdAt?: Date | null;
  }[];
  timeline: string;
  message?: string;
  creatorUsername?: string;
  createdByClerkId?: string;
  source: "general_form" | "creator_profile";
  status: BrandInquiryStatus;
  deliveryProof?: {
    videoUrl?: string;
    timestampStart?: string;
    timestampEnd?: string;
    notes?: string;
    screenshotUrl?: string;
    referenceLink?: string;
    submittedAt?: Date | null;
    reviewedAt?: Date | null;
    reviewNote?: string;
    issueNote?: string;
    issueReportedAt?: Date | null;
  };
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

const OfferHistorySchema = new Schema(
  {
    actor: { type: String, enum: ["brand", "creator"], required: true },
    action: {
      type: String,
      enum: ["offer_sent", "counter_requested", "counter_sent", "offer_accepted", "offer_declined"],
      required: true,
    },
    amount: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ["INR"], default: "INR" },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

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
    deliverables: [{ type: String }],
    targetNiches: [{ type: String }],
    targetPlatforms: [{ type: String }],
    budgetRange: { type: String, required: true },
    initialOfferAmount: { type: Number, min: 0, default: 0 },
    currentOfferAmount: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ["INR"], default: "INR" },
    isNegotiable: { type: Boolean, default: true },
    offerHistory: { type: [OfferHistorySchema], default: [] },
    timeline: { type: String, required: true },
    message: { type: String, default: "", maxlength: 1500 },
    creatorUsername: { type: String, default: "" },
    createdByClerkId: { type: String, default: "" },
    source: { type: String, enum: ["general_form", "creator_profile"], default: "general_form", index: true },
    status: {
      type: String,
      enum: BRAND_INQUIRY_STATUS_VALUES,
      default: "new",
      index: true,
    },
    deliveryProof: {
      videoUrl: { type: String, trim: true, default: "" },
      timestampStart: { type: String, trim: true, maxlength: 40, default: "" },
      timestampEnd: { type: String, trim: true, maxlength: 40, default: "" },
      notes: { type: String, trim: true, maxlength: 1000, default: "" },
      screenshotUrl: { type: String, trim: true, default: "" },
      referenceLink: { type: String, trim: true, default: "" },
      submittedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      reviewNote: { type: String, trim: true, maxlength: 1000, default: "" },
      issueNote: { type: String, trim: true, maxlength: 1000, default: "" },
      issueReportedAt: { type: Date, default: null },
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
