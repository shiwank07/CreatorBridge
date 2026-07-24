import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IInAppNotification extends Document {
  seedKey?: string;
  recipientUserId: mongoose.Types.ObjectId;
  recipientClerkUserId?: string;
  recipientRole?: "creator" | "brand" | "admin";
  actorUserId?: mongoose.Types.ObjectId | null;
  actorClerkUserId?: string;
  event: string;
  type?: string;
  entityType?: "collaboration" | "verification" | "message" | "creator" | "brand" | "system";
  entityId?: string;
  title: string;
  message: string;
  href: string;
  actionUrl?: string;
  deduplicationKey?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InAppNotificationSchema = new Schema<IInAppNotification>(
  {
    seedKey: { type: String, trim: true, default: undefined },
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientClerkUserId: { type: String, trim: true, default: "", index: true },
    recipientRole: { type: String, enum: ["creator", "brand", "admin"], default: undefined, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorClerkUserId: { type: String, trim: true, default: "" },
    event: { type: String, required: true, trim: true, index: true },
    type: { type: String, trim: true, default: "" },
    entityType: {
      type: String,
      enum: ["collaboration", "verification", "message", "creator", "brand", "system"],
      default: "system",
      index: true,
    },
    entityId: { type: String, trim: true, default: "", index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    href: { type: String, required: true, trim: true, maxlength: 500 },
    actionUrl: { type: String, trim: true, maxlength: 500, default: "/" },
    deduplicationKey: { type: String, trim: true, default: undefined },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

InAppNotificationSchema.index({ recipientUserId: 1, createdAt: -1 });
InAppNotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
InAppNotificationSchema.index({ recipientClerkUserId: 1, createdAt: -1 });
InAppNotificationSchema.index({ recipientClerkUserId: 1, isRead: 1 });
InAppNotificationSchema.index({ entityType: 1, entityId: 1 });
InAppNotificationSchema.index(
  { deduplicationKey: 1 },
  { unique: true, partialFilterExpression: { deduplicationKey: { $type: "string" } } },
);
InAppNotificationSchema.index(
  { seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: "string" } } },
);

export const InAppNotification =
  (mongoose.models.InAppNotification as Model<IInAppNotification> | undefined) ??
  mongoose.model<IInAppNotification>("InAppNotification", InAppNotificationSchema);
