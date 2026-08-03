import mongoose from "mongoose";

import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { EmailNotification } from "@/lib/models/EmailNotification";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { SavedCreator } from "@/lib/models/SavedCreator";
import { User } from "@/lib/models/User";

type AccountDeletionModels = {
  UserModel?: typeof User; CreatorProfileModel?: typeof CreatorProfile; BrandProfileModel?: typeof BrandProfile;
  CreatorVerificationRequestModel?: typeof CreatorVerificationRequest; SavedCreatorModel?: typeof SavedCreator;
  InAppNotificationModel?: typeof InAppNotification; BrandInquiryModel?: typeof BrandInquiry; EmailNotificationModel?: typeof EmailNotification;
};

export type DeletionSource = "self_service" | "clerk_webhook";

export async function anonymizeDeletedAccount(input: {
  clerkUserId: string;
  deletedAt: Date;
  eventId: string;
  eventTimestamp: Date;
  source: DeletionSource;
}, models: AccountDeletionModels = {}) {
  const UserModel = models.UserModel ?? User;
  const CreatorProfileModel = models.CreatorProfileModel ?? CreatorProfile;
  const BrandProfileModel = models.BrandProfileModel ?? BrandProfile;
  const CreatorVerificationRequestModel = models.CreatorVerificationRequestModel ?? CreatorVerificationRequest;
  const SavedCreatorModel = models.SavedCreatorModel ?? SavedCreator;
  const InAppNotificationModel = models.InAppNotificationModel ?? InAppNotification;
  const BrandInquiryModel = models.BrandInquiryModel ?? BrandInquiry;
  const EmailNotificationModel = models.EmailNotificationModel ?? EmailNotification;
  const ordering = {
    $or: [
      { latestClerkEventAt: { $lt: input.eventTimestamp } },
      { latestClerkEventAt: null },
      { latestClerkEventAt: { $exists: false } },
      { latestClerkEventAt: input.eventTimestamp, latestClerkEventId: input.eventId },
    ],
  };
  let current = await UserModel.findOne({ clerkId: input.clerkUserId }).select("_id email latestClerkEventAt latestClerkEventId").lean();
  if (!current) {
    const tombstoneId = new mongoose.Types.ObjectId();
    const suffix = tombstoneId.toString();
    try {
      await UserModel.create({
        _id: tombstoneId, clerkId: input.clerkUserId, email: `deleted-${suffix}@branzzo.local`,
        emailVerified: false, username: `deleted${suffix}`, name: "Deleted account", avatar: "",
        role: "creator", onboardingComplete: false, accountStatus: "deleted", deletedAt: input.deletedAt,
        latestClerkEventAt: input.eventTimestamp, latestClerkEventId: input.eventId,
      });
      current = await UserModel.findById(tombstoneId).select("_id email latestClerkEventAt latestClerkEventId").lean();
    } catch (error) {
      if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
      current = await UserModel.findOne({ clerkId: input.clerkUserId }).select("_id email latestClerkEventAt latestClerkEventId").lean();
    }
  }
  if (!current) throw new Error("Could not create account deletion tombstone.");
  const anonymizedEmail = `deleted-${current._id.toString()}@branzzo.local`;
  const updated = await UserModel.findOneAndUpdate(
    { _id: current._id, ...ordering },
    {
      $set: {
        email: anonymizedEmail,
        emailVerified: false,
        username: `deleted${current._id.toString()}`,
        name: "Deleted account",
        avatar: "",
        phoneNumber: "",
        phoneVerified: false,
        phoneVerifiedAt: null,
        onboardingComplete: false,
        subscriptionTier: "free",
        subscriptionExpiry: null,
        isFeatured: false,
        isVerified: false,
        accountStatus: "deleted",
        deletedAt: input.deletedAt,
        trustReviewStatus: "clear",
        trustReviewNote: "",
        lastTrustReviewedAt: input.deletedAt,
        emailPreferences: {
          collaborationInvitations: false,
          collaborationStatusUpdates: false,
          verificationUpdates: false,
          productAnnouncements: false,
          weeklyDigest: false,
          marketingEmail: false,
        },
        latestClerkEventAt: input.eventTimestamp,
        latestClerkEventId: input.eventId,
      },
    },
    { new: true },
  );
  if (!updated) return { outcome: "stale" as const };

  const userId = updated._id as mongoose.Types.ObjectId;
  await CreatorProfileModel.deleteMany({ userId });
  await BrandProfileModel.deleteMany({ userId });
  await CreatorVerificationRequestModel.deleteMany({ clerkUserId: input.clerkUserId });
  await SavedCreatorModel.deleteMany({ $or: [{ brandUserId: userId }, { creatorUserId: userId }] });
  await InAppNotificationModel.deleteMany({ recipientUserId: userId });
  await InAppNotificationModel.updateMany(
      { actorUserId: userId },
      { $set: { actorUserId: null, actorClerkUserId: "", metadata: {} } },
    );
  await BrandInquiryModel.updateMany(
      { brandUserId: userId },
      { $set: { contactName: "Deleted account", email: anonymizedEmail, website: "" } },
    );
  await BrandInquiryModel.updateMany(
      { creatorUserId: userId },
      { $set: { creatorUsername: "deleted-creator" } },
    );
  await EmailNotificationModel.updateMany(
      { recipient: current.email },
      { $set: { recipient: anonymizedEmail } },
    );
  return { outcome: "deleted" as const, userId: userId.toString(), source: input.source };
}
