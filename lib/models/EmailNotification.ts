import mongoose, { type Document, type Model, Schema } from "mongoose";

export type EmailNotificationStatus = "processing" | "sent" | "delivered" | "delayed" | "failed" | "permanent_failed" | "bounced" | "complained" | "suppressed" | "skipped";

export interface IEmailNotification extends Document {
  recipient: string;
  event: string;
  deliveryKey?: string;
  status: EmailNotificationStatus;
  providerId?: string | null;
  error?: string | null;
  attempts: number;
  lastAttemptAt?: Date | null;
  nextRetryAt?: Date | null;
  deliveredAt?: Date | null;
  providerUpdatedAt?: Date | null;
  webhookEventIds: string[];
  retryable: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const EmailNotificationSchema = new Schema<IEmailNotification>(
  {
    recipient: { type: String, required: true, lowercase: true, trim: true, index: true },
    event: { type: String, required: true, trim: true, index: true },
    deliveryKey: { type: String, trim: true, default: undefined },
    status: { type: String, enum: ["processing", "sent", "delivered", "delayed", "failed", "permanent_failed", "bounced", "complained", "suppressed", "skipped"], required: true, index: true },
    providerId: { type: String, trim: true, default: null },
    error: { type: String, trim: true, maxlength: 1000, default: null },
    attempts: { type: Number, min: 0, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    nextRetryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    providerUpdatedAt: { type: Date, default: null },
    webhookEventIds: { type: [String], default: [] },
    retryable: { type: Boolean, default: false },
  },
  { timestamps: true },
);

EmailNotificationSchema.index(
  { deliveryKey: 1 },
  { unique: true, partialFilterExpression: { deliveryKey: { $type: "string" } } },
);
EmailNotificationSchema.index({ recipient: 1, event: 1, createdAt: -1 });
EmailNotificationSchema.index({ status: 1, createdAt: -1, _id: -1 });
EmailNotificationSchema.index({ event: 1, createdAt: -1, _id: -1 });
EmailNotificationSchema.index({ providerId: 1 }, { sparse: true });
EmailNotificationSchema.index({ status: 1, retryable: 1, nextRetryAt: 1 });
EmailNotificationSchema.index({ status: 1, lastAttemptAt: 1 });
EmailNotificationSchema.index({ webhookEventIds: 1 }, { unique: true, sparse: true });

export const EmailNotification =
  (mongoose.models.EmailNotification as Model<IEmailNotification> | undefined) ??
  mongoose.model<IEmailNotification>("EmailNotification", EmailNotificationSchema);
