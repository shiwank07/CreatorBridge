import mongoose, { type Document, type Model, Schema } from "mongoose";

import { BRAND_INQUIRY_STATUS_VALUES, type BrandInquiryStatus, type CollaborationTimelineEvent } from "@/lib/collaborations";
import { type PaymentStatus } from "@/lib/types";

type OfferHistoryAction = "offer_sent" | "counter_requested" | "counter_sent" | "offer_accepted" | "offer_declined";

export interface IBrandInquiry extends Document {
  seedKey?: string;
  collaborationNumber?: string;
  brandUserId?: mongoose.Types.ObjectId;
  brandProfileId?: mongoose.Types.ObjectId;
  creatorUserId?: mongoose.Types.ObjectId;
  creatorProfileId?: mongoose.Types.ObjectId;
  companyName: string;
  contactName: string;
  email: string;
  website?: string;
  campaignGoal: string;
  campaignTitle?: string;
  campaignType?: string;
  deadline?: Date | null;
  attachments: string[];
  deliverables: string[];
  targetNiches: string[];
  targetPlatforms: string[];
  customPlatformName?: string;
  budgetRange: string;
  initialOfferAmount?: number;
  currentOfferAmount?: number;
  currency?: string;
  isNegotiable: boolean;
  offerHistory: {
    _id?: mongoose.Types.ObjectId;
    actor: "brand" | "creator";
    action: OfferHistoryAction;
    amount?: number;
    currency: string;
    note?: string;
    createdAt?: Date | null;
  }[];
  timeline: string;
  message?: string;
  creatorUsername?: string;
  createdByClerkId?: string;
  source: "general_form" | "creator_profile";
  status: BrandInquiryStatus;
  statusHistory: {
    _id?: mongoose.Types.ObjectId;
    event: CollaborationTimelineEvent;
    status: BrandInquiryStatus;
    actor: "brand" | "creator" | "admin" | "system";
    note?: string;
    createdAt?: Date | null;
  }[];
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
    issueStatus?: "open" | "resolved" | "dismissed";
    issueReviewedAt?: Date | null;
    issueReviewedByAdminId?: string;
  };
  adminOwnerId?: string;
  adminNote?: string;
  reviewedAt?: Date | null;
  sentToCreatorAt?: Date | null;
  creatorResponseAt?: Date | null;
  firstViewedAt?: Date | null;
  firstCreatorResponseAt?: Date | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  cancelledAt?: Date | null;
  workStartedAt?: Date | null;
  proofSubmittedAt?: Date | null;
  completedAt?: Date | null;
  lastMeaningfulActivityAt?: Date | null;
  creatorResponseNote?: string;
  closedAt?: Date | null;
  paymentStatus: PaymentStatus;
  creatorStatus?: string;
  brandStatus?: string;
  currentStage?: string;
  negotiationPrice?: number;
  revisionCount: number;
  maxRevisions: number;
  notes?: string;
  paymentNote?: string;
  paymentScreenshotUrl?: string;
  paymentUpdatedAt?: Date | null;
  paymentUpdatedBy?: "brand" | "creator" | "admin" | "system";
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
    currency: { type: String, uppercase: true, trim: true, default: undefined },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const StatusHistorySchema = new Schema(
  {
    event: {
      type: String,
      enum: ["CREATED", "VIEWED", "COUNTERED", "ACCEPTED", "DECLINED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED", "CANCELLED"],
      required: true,
      index: true,
    },
    status: { type: String, enum: BRAND_INQUIRY_STATUS_VALUES, required: true, index: true },
    actor: { type: String, enum: ["brand", "creator", "admin", "system"], default: "system" },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const BrandInquirySchema = new Schema<IBrandInquiry>(
  {
    seedKey: { type: String, trim: true, default: undefined },
    collaborationNumber: { type: String, trim: true, default: "" },
    brandUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    brandProfileId: { type: Schema.Types.ObjectId, ref: "BrandProfile", default: null, index: true },
    creatorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    creatorProfileId: { type: Schema.Types.ObjectId, ref: "CreatorProfile", default: null, index: true },
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    website: { type: String, default: "" },
    campaignGoal: { type: String, required: true, maxlength: 1000 },
    campaignTitle: { type: String, trim: true, maxlength: 160, default: "" },
    campaignType: { type: String, trim: true, maxlength: 80, default: "Sponsorship" },
    deadline: { type: Date, default: null, index: true },
    attachments: [{ type: String, trim: true, maxlength: 500 }],
    deliverables: [{ type: String }],
    targetNiches: [{ type: String }],
    targetPlatforms: [{ type: String }],
    customPlatformName: { type: String, trim: true, maxlength: 80, default: "" },
    budgetRange: { type: String, required: true },
    initialOfferAmount: { type: Number, min: 0, default: 0 },
    currentOfferAmount: { type: Number, min: 0, default: 0 },
    currency: { type: String, uppercase: true, trim: true, default: undefined },
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
      default: "NEW",
      index: true,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
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
      issueStatus: { type: String, enum: ["open", "resolved", "dismissed"], default: "open", index: true },
      issueReviewedAt: { type: Date, default: null },
      issueReviewedByAdminId: { type: String, default: "" },
    },
    adminOwnerId: { type: String, default: "" },
    adminNote: { type: String, maxlength: 1000, default: "" },
    reviewedAt: { type: Date, default: null },
    sentToCreatorAt: { type: Date, default: null },
    creatorResponseAt: { type: Date, default: null },
    firstViewedAt: { type: Date, default: null },
    firstCreatorResponseAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    workStartedAt: { type: Date, default: null },
    proofSubmittedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    lastMeaningfulActivityAt: { type: Date, default: null },
    creatorResponseNote: { type: String, maxlength: 1000, default: "" },
    closedAt: { type: Date, default: null },
    paymentStatus: {
      type: String,
      enum: ["payment_pending", "payment_sent", "payment_received", "payment_disputed"],
      default: "payment_pending",
      index: true,
    },
    paymentNote: { type: String, trim: true, maxlength: 1000, default: "" },
    paymentScreenshotUrl: { type: String, trim: true, maxlength: 500, default: "" },
    paymentUpdatedAt: { type: Date, default: null },
    paymentUpdatedBy: { type: String, enum: ["brand", "creator", "admin", "system"], default: "system" },
    creatorStatus: { type: String, trim: true, default: "pending" },
    brandStatus: { type: String, trim: true, default: "sent" },
    currentStage: { type: String, trim: true, default: "Sent", index: true },
    negotiationPrice: { type: Number, min: 0, default: 0 },
    revisionCount: { type: Number, min: 0, default: 0 },
    maxRevisions: { type: Number, min: 0, max: 20, default: 2 },
    notes: { type: String, trim: true, maxlength: 1500, default: "" },
    ipHash: { type: String, default: "" },
    userAgentHash: { type: String, default: "" },
  },
  { timestamps: true },
);

BrandInquirySchema.index(
  { seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: "string" } } },
);
BrandInquirySchema.index(
  { collaborationNumber: 1 },
  { unique: true, partialFilterExpression: { collaborationNumber: { $type: "string", $ne: "" } } },
);
BrandInquirySchema.index({ brandUserId: 1, status: 1, updatedAt: -1 });
BrandInquirySchema.index({ creatorUserId: 1, status: 1, updatedAt: -1 });
BrandInquirySchema.index({ brandUserId: 1, createdAt: -1 });
BrandInquirySchema.index({ creatorUserId: 1, createdAt: -1 });
BrandInquirySchema.index({ brandProfileId: 1, createdAt: -1 });
BrandInquirySchema.index({ creatorProfileId: 1, createdAt: -1 });
BrandInquirySchema.index({ createdByClerkId: 1, createdAt: -1 });
BrandInquirySchema.index({ acceptedAt: -1 });
BrandInquirySchema.index({ rejectedAt: -1 });
BrandInquirySchema.index({ cancelledAt: -1 });
BrandInquirySchema.index({ completedAt: -1 });
BrandInquirySchema.index({ firstCreatorResponseAt: -1 });
BrandInquirySchema.index({ brandUserId: 1, status: 1, deadline: 1 });
BrandInquirySchema.index({ creatorUserId: 1, status: 1, deadline: 1 });
BrandInquirySchema.index({ status: 1, lastMeaningfulActivityAt: 1 });
BrandInquirySchema.index({ status: 1, updatedAt: -1 });

export const BrandInquiry =
  (mongoose.models.BrandInquiry as Model<IBrandInquiry> | undefined) ??
  mongoose.model<IBrandInquiry>("BrandInquiry", BrandInquirySchema);
