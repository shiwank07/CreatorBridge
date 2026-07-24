import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ISavedCreator extends Document {
  brandUserId: mongoose.Types.ObjectId;
  creatorUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SavedCreatorSchema = new Schema<ISavedCreator>(
  {
    brandUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    creatorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

SavedCreatorSchema.index({ brandUserId: 1, creatorUserId: 1 }, { unique: true });
SavedCreatorSchema.index({ brandUserId: 1, createdAt: -1 });

export const SavedCreator =
  (mongoose.models.SavedCreator as Model<ISavedCreator> | undefined) ??
  mongoose.model<ISavedCreator>("SavedCreator", SavedCreatorSchema);
