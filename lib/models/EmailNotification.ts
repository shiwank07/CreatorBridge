import mongoose, { type Document, type Model, Schema } from "mongoose";

export type EmailNotificationStatus = "queued" | "sent" | "failed" | "skipped";

export interface IEmailNotification extends Document {
  type: string;
  toEmail: string;
  toUserId?: mongoose.Types.ObjectId | null;
  subject: string;
  templateKey: string;
  relatedType?: string;
  relatedId?: mongoose.Types.ObjectId | null;
  payload: Record<string, unknown>;
  status: EmailNotificationStatus;
  attempts: number;
  providerMessageId?: string;
  lastError?: string;
  idempotencyKey?: string;
  queuedAt: Date;
  sentAt?: Date | null;
  nextRetryAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmailNotificationSchema = new Schema<IEmailNotification>(
  {
    type: { type: String, required: true, trim: true, index: true },
    toEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    templateKey: { type: String, required: true, trim: true, index: true },
    relatedType: { type: String, trim: true, default: "" },
    relatedId: { type: Schema.Types.ObjectId, default: null, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["queued", "sent", "failed", "skipped"], default: "queued", index: true },
    attempts: { type: Number, default: 0, min: 0 },
    providerMessageId: { type: String, trim: true, default: "" },
    lastError: { type: String, trim: true, maxlength: 1000, default: "" },
    idempotencyKey: { type: String, trim: true, default: "" },
    queuedAt: { type: Date, default: Date.now },
    sentAt: { type: Date, default: null },
    nextRetryAt: { type: Date, default: null },
  },
  { timestamps: true },
);

EmailNotificationSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string", $ne: "" } },
  },
);

export const EmailNotification =
  (mongoose.models.EmailNotification as Model<IEmailNotification> | undefined) ??
  mongoose.model<IEmailNotification>("EmailNotification", EmailNotificationSchema);
