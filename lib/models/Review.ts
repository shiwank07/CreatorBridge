import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IReview extends Document {
  seedKey?: string;
  collaborationId: mongoose.Types.ObjectId;
  reviewerUserId: mongoose.Types.ObjectId;
  revieweeUserId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    seedKey: { type: String, trim: true, default: undefined },
    collaborationId: { type: Schema.Types.ObjectId, ref: "BrandInquiry", required: true, index: true },
    reviewerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    revieweeUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

ReviewSchema.index({ collaborationId: 1, reviewerUserId: 1 }, { unique: true });
ReviewSchema.index(
  { seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: "string" } } },
);

export const Review =
  (mongoose.models.Review as Model<IReview> | undefined) ?? mongoose.model<IReview>("Review", ReviewSchema);
