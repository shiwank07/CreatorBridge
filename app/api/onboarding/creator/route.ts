import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { connectDB, hasMongoUri } from "@/lib/db";
import { hasClerkKeys } from "@/lib/clerk-config";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { creatorOnboardingSchema } from "@/lib/validators/creator";
import { isCreatorVerifiedStatus } from "@/lib/verification";
import { normalizeYoutubeChannelKey } from "@/lib/verification-helpers";

function hasNumberChanged(previous?: number | null, next?: number | null) {
  return Number(previous ?? 0) !== Number(next ?? 0);
}

export async function POST(req: Request) {
  try {
    if (!hasClerkKeys()) {
      return NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before creating a creator profile." }, { status: 401 });
    }

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = creatorOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid creator profile." }, { status: 400 });
    }

    await connectDB();

    const usernameOwner = await User.findOne({
      username: parsed.data.username,
      clerkId: { $ne: userId },
    });

    if (usernameOwner) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const existingUser = await User.findOne({ clerkId: userId });
    const phoneVerified = Boolean(existingUser?.phoneVerified && (existingUser.phoneNumber ?? "") === parsed.data.phoneNumber);
    const clerkUser = await currentUser();
    const email =
      clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      `${userId}@branzzo.local`;

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          email,
          username: parsed.data.username,
          name: parsed.data.name,
          phoneNumber: parsed.data.phoneNumber,
          phoneVerified,
          // TODO: Add Cloudflare R2 or UploadThing upload support. Keep MongoDB storage to the image URL only.
          avatar: parsed.data.avatar || existingUser?.avatar || clerkUser?.imageUrl || "",
          role: "creator",
          onboardingComplete: true,
        },
        $setOnInsert: {
          subscriptionTier: "free",
          subscriptionExpiry: null,
          isFeatured: false,
          isVerified: false,
        },
      },
      { upsert: true, new: true },
    );

    const existingProfile = await CreatorProfile.findOne({ userId: user._id });
    const platformChanged = Boolean(
      existingProfile &&
        (existingProfile.youtubeUrl !== parsed.data.youtubeUrl ||
          existingProfile.youtubeHandle !== parsed.data.youtubeHandle ||
          existingProfile.instagramUrl !== parsed.data.instagramUrl ||
          existingProfile.podcastUrl !== parsed.data.podcastUrl),
    );
    const existingClaimedSubscribers = existingProfile?.claimedSubscribers ?? existingProfile?.subscribers ?? 0;
    const existingClaimedAverageViews = existingProfile?.claimedAverageViews ?? existingProfile?.avgViews ?? 0;
    const existingClaimedEngagementRate = existingProfile?.claimedEngagementRate ?? 0;
    const statsChanged = Boolean(
      existingProfile &&
        (hasNumberChanged(existingClaimedSubscribers, parsed.data.subscribers) ||
          hasNumberChanged(existingClaimedAverageViews, parsed.data.avgViews) ||
          hasNumberChanged(existingClaimedEngagementRate, parsed.data.engagementRate)),
    );
    const previousStatsStatus =
      existingProfile?.statsVerificationStatus && existingProfile.statsVerificationStatus !== "unverified"
        ? existingProfile.statsVerificationStatus
        : isCreatorVerifiedStatus(existingProfile?.verificationStatus)
          ? "verified"
          : existingProfile?.statsVerificationStatus ?? "unverified";
    const statsVerificationStatus =
      existingProfile && previousStatsStatus === "verified" && (statsChanged || platformChanged)
        ? "needs_review"
        : previousStatsStatus;
    const verificationCode = platformChanged ? "" : existingProfile?.verificationCode ?? "";
    const verificationStatus = platformChanged
      ? isCreatorVerifiedStatus(existingProfile?.verificationStatus)
        ? "needs_review"
        : existingProfile?.verificationStatus === "pending" || existingProfile?.verificationStatus === "pending_ownership"
          ? "pending"
          : "unverified"
      : existingProfile?.verificationStatus ?? "unverified";
    const verificationCodeExpiresAt = platformChanged ? null : existingProfile?.verificationCodeExpiresAt ?? null;

    await CreatorProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          bio: parsed.data.bio,
          phoneNumber: parsed.data.phoneNumber,
          phoneVerified,
          niche: parsed.data.niche,
          country: parsed.data.country,
          languages: parsed.data.languages,
          youtubeUrl: parsed.data.youtubeUrl,
          youtubeHandle: parsed.data.youtubeHandle,
          subscribers: parsed.data.subscribers,
          claimedSubscribers: parsed.data.subscribers,
          claimedAverageViews: parsed.data.avgViews,
          claimedEngagementRate: parsed.data.engagementRate,
          statsVerificationStatus,
          verificationStatus,
          verificationCode,
          verificationCodeExpiresAt,
          normalizedYoutubeChannelKey: normalizeYoutubeChannelKey(parsed.data.youtubeUrl, parsed.data.youtubeHandle),
          ...(platformChanged
            ? {
                verificationPlatform: "youtube",
                verificationProfileUrl: "",
                verificationSubmittedNote: "",
                verificationNote: "",
                verificationSubmittedAt: null,
                verificationReviewedAt: null,
                verificationReviewedByAdminId: "",
                verificationRejectedReason: "",
                lastVerifiedAt: null,
                verifiedAt: existingProfile?.verifiedAt ?? existingProfile?.lastVerifiedAt ?? null,
              }
            : {}),
          avgViews: parsed.data.avgViews,
          instagramUrl: parsed.data.instagramUrl,
          instagramFollowers: parsed.data.instagramFollowers,
          podcastUrl: parsed.data.podcastUrl,
          sponsorshipRate: parsed.data.sponsorshipRate,
          rateType: parsed.data.rateType,
          pastBrands: parsed.data.pastBrands,
          sampleWorkUrls: parsed.data.sampleWorkUrls,
          isOpenToDeals: parsed.data.isOpenToDeals,
        },
      },
      { upsert: true, new: true },
    );

    if (platformChanged) {
      await User.updateOne({ _id: user._id }, { $set: { isVerified: false } });
    }

    return NextResponse.json({
      ok: true,
      username: parsed.data.username,
      verificationCode: verificationCode || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "Creator onboarding failed", "Could not save your creator profile.");
  }
}
