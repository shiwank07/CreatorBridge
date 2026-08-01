import mongoose, { type Document, type Model, Schema } from "mongoose";

export type ClerkWebhookProcessingStatus = "processing" | "processed" | "failed" | "skipped";

export interface IClerkWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  clerkUserId?: string;
  eventTimestamp: Date;
  receivedAt: Date;
  processedAt?: Date | null;
  status: ClerkWebhookProcessingStatus;
  error?: string | null;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClerkWebhookEventSchema = new Schema<IClerkWebhookEvent>({
  eventId: { type: String, required: true, unique: true, index: true },
  eventType: { type: String, required: true, trim: true, index: true },
  clerkUserId: { type: String, trim: true, default: "", index: true },
  eventTimestamp: { type: Date, required: true, index: true },
  receivedAt: { type: Date, required: true, default: Date.now },
  processedAt: { type: Date, default: null },
  status: { type: String, enum: ["processing", "processed", "failed", "skipped"], required: true, index: true },
  error: { type: String, trim: true, maxlength: 500, default: null },
  attempts: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

ClerkWebhookEventSchema.index({ status: 1, updatedAt: 1 });
ClerkWebhookEventSchema.index({ clerkUserId: 1, eventTimestamp: -1 });

export const ClerkWebhookEvent =
  (mongoose.models.ClerkWebhookEvent as Model<IClerkWebhookEvent> | undefined) ??
  mongoose.model<IClerkWebhookEvent>("ClerkWebhookEvent", ClerkWebhookEventSchema);
