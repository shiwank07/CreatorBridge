import mongoose, { type Document, type Model, Schema } from "mongoose";

export type EmailNotificationStatus = "sent" | "failed" | "skipped";

export interface IEmailNotification extends Document {
  recipient: string;
  event: string;
  status: EmailNotificationStatus;
  providerId?: string | null;
  error?: string | null;
  createdAt: Date;
}

const EmailNotificationSchema = new Schema<IEmailNotification>(
  {
    recipient: { type: String, required: true, lowercase: true, trim: true, index: true },
    event: { type: String, required: true, trim: true, index: true },
    status: { type: String, enum: ["sent", "failed", "skipped"], required: true, index: true },
    providerId: { type: String, trim: true, default: null },
    error: { type: String, trim: true, maxlength: 1000, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

EmailNotificationSchema.index({ recipient: 1, event: 1, createdAt: -1 });

export const EmailNotification =
  (mongoose.models.EmailNotification as Model<IEmailNotification> | undefined) ??
  mongoose.model<IEmailNotification>("EmailNotification", EmailNotificationSchema);
