import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId | null;
  senderRole: "brand" | "creator" | "system";
  message: string;
  messageType: "text";
  systemEventKey?: string;
  createdAt: Date;
  editedAt?: Date | null;
  readAt?: Date | null;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    senderRole: { type: String, enum: ["brand", "creator", "system"], required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    messageType: { type: String, enum: ["text"], default: "text" },
    systemEventKey: { type: String, default: undefined },
    editedAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index(
  { conversationId: 1, systemEventKey: 1 },
  { unique: true, partialFilterExpression: { systemEventKey: { $type: "string" } } },
);

export const Message =
  (mongoose.models.Message as Model<IMessage> | undefined) ?? mongoose.model<IMessage>("Message", MessageSchema);
