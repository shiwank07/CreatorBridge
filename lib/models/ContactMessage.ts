import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  topic: "support" | "partnerships" | "legal";
  subject: string;
  message: string;
  status: "new" | "reviewing" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 160, index: true },
  topic: { type: String, enum: ["support", "partnerships", "legal"], required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["new", "reviewing", "resolved"], default: "new", index: true },
}, { timestamps: true });

ContactMessageSchema.index({ createdAt: -1 });

export const ContactMessage =
  (mongoose.models.ContactMessage as Model<IContactMessage> | undefined) ??
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
