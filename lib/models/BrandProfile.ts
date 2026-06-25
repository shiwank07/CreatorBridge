import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IBrandProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  website?: string;
  industry: string;
  companySize?: string;
  country?: string;
  notes?: string;
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
    website: { type: String, trim: true, default: "" },
    industry: { type: String, required: true, trim: true, maxlength: 80, index: true },
    companySize: { type: String, trim: true, maxlength: 80, default: "" },
    country: { type: String, trim: true, maxlength: 80, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

BrandProfileSchema.index({ companyName: 1 });

export const BrandProfile =
  (mongoose.models.BrandProfile as Model<IBrandProfile> | undefined) ??
  mongoose.model<IBrandProfile>("BrandProfile", BrandProfileSchema);
