import mongoose from "mongoose";

import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { EmailNotification } from "@/lib/models/EmailNotification";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { SavedCreator } from "@/lib/models/SavedCreator";
import { User } from "@/lib/models/User";

export type DeletionSource = "self_service" | "clerk_webhook";

export async function anonymizeDeletedAccount(input: {
  clerkUserId: string;
  deletedAt: Date;
  eventId: string;
  eventTimestamp: Date;
  source: DeletionSource;
}) {
  const ordering = {
    $or: [
      { latestClerkEventAt: { $lt: input.eventTimestamp } },
      { latestClerkEventAt: null },
      { latestClerkEventAt: { $exists: false } },
      { latestClerkEventAt: input.eventTimestamp, latestClerkEventId: input.eventId },
    ],
  };
  let current = await User.findOne({ clerkId: input.clerkUserId }).select("_id email latestClerkEventAt latestClerkEventId").lean();
  if (!current) {
    const tombstoneId = new mongoose.Types.ObjectId();
    const suffix = tombstoneId.toString();
    try {
      await User.create({
        _id: tombstoneId, clerkId: input.clerkUserId, email: `deleted-${suffix}@branzzo.local`,
        emailVerified: false, username: `deleted${suffix}`, name: "Deleted account", avatar: "",
        role: "creator", onboardingComplete: false, accountStatus: "deleted", deletedAt: input.deletedAt,
        latestClerkEventAt: input.eventTimestamp, latestClerkEventId: input.eventId,
      });
      current = await User.findById(tombstoneId).select("_id email latestClerkEventAt latestClerkEventId").lean();
    } catch (error) {
      if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
      current = await User.findOne({ clerkId: input.clerkUserId }).select("_id email latestClerkEventAt latestClerkEventId").lean();
    }
  }
  if (!current) throw new Error("Could not create account deletion tombstone.");
  const anonymizedEmail = `deleted-${current._id.toString()}@branzzo.local`;
  const updated = await User.findOneAndUpdate(
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
  await Promise.all([
    CreatorProfile.deleteMany({ userId }),
    BrandProfile.deleteMany({ userId }),
    CreatorVerificationRequest.deleteMany({ clerkUserId: input.clerkUserId }),
    SavedCreator.deleteMany({ $or: [{ brandUserId: userId }, { creatorUserId: userId }] }),
    InAppNotification.deleteMany({ recipientUserId: userId }),
    InAppNotification.updateMany(
      { actorUserId: userId },
      { $set: { actorUserId: null, actorClerkUserId: "", metadata: {} } },
    ),
    BrandInquiry.updateMany(
      { brandUserId: userId },
      { $set: { contactName: "Deleted account", email: anonymizedEmail, website: "" } },
    ),
    BrandInquiry.updateMany(
      { creatorUserId: userId },
      { $set: { creatorUsername: "deleted-creator" } },
    ),
    EmailNotification.updateMany(
      { recipient: current.email },
      { $set: { recipient: anonymizedEmail } },
    ),
  ]);
  return { outcome: "deleted" as const, userId: userId.toString(), source: input.source };
}
