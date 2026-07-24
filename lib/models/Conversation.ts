import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IConversation extends Document {
  collaborationId: mongoose.Types.ObjectId;
  brandId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  lastMessageAt?: Date | null;
  lastMessagePreview: string;
  unreadForBrand: number;
  unreadForCreator: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    collaborationId: { type: Schema.Types.ObjectId, ref: "BrandInquiry", required: true, unique: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessagePreview: { type: String, maxlength: 180, default: "" },
    unreadForBrand: { type: Number, min: 0, default: 0 },
    unreadForCreator: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

ConversationSchema.index({ brandId: 1, lastMessageAt: -1 });
ConversationSchema.index({ creatorId: 1, lastMessageAt: -1 });

export const Conversation =
  (mongoose.models.Conversation as Model<IConversation> | undefined) ??
  mongoose.model<IConversation>("Conversation", ConversationSchema);
