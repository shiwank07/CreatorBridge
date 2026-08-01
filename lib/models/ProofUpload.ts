import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IProofUpload extends Document {
  collaborationId: mongoose.Types.ObjectId;
  uploaderUserId: mongoose.Types.ObjectId;
  uploaderClerkId: string;
  objectKey: string;
  originalFilename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileSize: number;
  proofType: "payment" | "campaign";
  transactionId?: string;
  note?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedBy?: string;
  verifiedAt?: Date | null;
  createdAt: Date;
}

const ProofUploadSchema = new Schema<IProofUpload>({
  collaborationId: { type: Schema.Types.ObjectId, ref: "BrandInquiry", required: true, index: true },
  uploaderUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  uploaderClerkId: { type: String, required: true },
  objectKey: { type: String, required: true, unique: true, select: false },
  originalFilename: { type: String, required: true, maxlength: 180 },
  mimeType: { type: String, enum: ["image/jpeg", "image/png", "image/webp"], required: true },
  fileSize: { type: Number, required: true, min: 1, max: 1024 * 1024 },
  proofType: { type: String, enum: ["payment", "campaign"], required: true, index: true },
  transactionId: { type: String, trim: true, maxlength: 120, default: "" },
  note: { type: String, trim: true, maxlength: 1000, default: "" },
  verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  verifiedBy: { type: String, default: "" },
  verifiedAt: { type: Date, default: null },
}, { timestamps: true });

ProofUploadSchema.index({ collaborationId: 1, proofType: 1, createdAt: -1 });
export const ProofUpload = (mongoose.models.ProofUpload as Model<IProofUpload> | undefined) ?? mongoose.model<IProofUpload>("ProofUpload", ProofUploadSchema);
