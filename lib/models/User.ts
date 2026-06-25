import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  email: string;
  username: string;
  name: string;
  avatar: string;
  role: "creator" | "brand" | "agency" | "talent";
  onboardingComplete: boolean;
  subscriptionTier: "free" | "pro" | "business";
  subscriptionExpiry: Date | null;
  isFeatured: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: ["creator", "brand", "agency", "talent"],
      default: "creator",
      required: true,
    },
    onboardingComplete: { type: Boolean, default: false },
    subscriptionTier: { type: String, enum: ["free", "pro", "business"], default: "free" },
    subscriptionExpiry: { type: Date, default: null },
    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", UserSchema);
