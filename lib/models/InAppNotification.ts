import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IInAppNotification extends Document {
  seedKey?: string;
  recipientUserId: mongoose.Types.ObjectId;
  actorUserId?: mongoose.Types.ObjectId | null;
  event: string;
  title: string;
  message: string;
  href: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InAppNotificationSchema = new Schema<IInAppNotification>(
  {
    seedKey: { type: String, trim: true, default: undefined },
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    event: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    href: { type: String, required: true, trim: true, maxlength: 500 },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

InAppNotificationSchema.index({ recipientUserId: 1, createdAt: -1 });
InAppNotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
InAppNotificationSchema.index(
  { seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: "string" } } },
);

export const InAppNotification =
  (mongoose.models.InAppNotification as Model<IInAppNotification> | undefined) ??
  mongoose.model<IInAppNotification>("InAppNotification", InAppNotificationSchema);
