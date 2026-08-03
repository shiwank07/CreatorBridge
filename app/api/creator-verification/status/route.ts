import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { hasMongoUri, modelForConnection, withMongoRequest } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { User } from "@/lib/models/User";
import { createVerificationCode, verificationCodeExpiry } from "@/lib/verification-helpers";

async function ensureVerificationCode(profileId: string, currentCode: string | undefined, ProfileModel: typeof CreatorProfile) {
  if (currentCode) return currentCode;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const verificationCode = createVerificationCode();
    if (await ProfileModel.exists({ verificationCode })) continue;

    const updated = await ProfileModel.findOneAndUpdate(
      { _id: profileId, verificationCode: { $in: ["", null] } },
      { $set: { verificationCode, verificationCodeExpiresAt: verificationCodeExpiry() } },
      { new: true },
    );
    return updated?.verificationCode ?? verificationCode;
  }

  throw new Error("Could not allocate a unique verification code.");
}

export async function GET() {
  try {
    if (!hasClerkKeys()) {
      return NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before checking verification." }, { status: 401 });
    }

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    return await withMongoRequest("creator-verification-status", async (connection) => {
    const ScopedUser = modelForConnection(connection, User);
    const ScopedCreatorProfile = modelForConnection(connection, CreatorProfile);
    const ScopedVerificationRequest = modelForConnection(connection, CreatorVerificationRequest);
    const user = await ScopedUser.findOne({ clerkId: userId, role: "creator" });
    if (!user) return NextResponse.json({ error: "Creator account not found." }, { status: 404 });

    const profile = await ScopedCreatorProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });

    const verificationCode = await ensureVerificationCode(profile._id.toString(), profile.verificationCode, ScopedCreatorProfile);
    const latestRequest = await ScopedVerificationRequest.findOne({ creatorId: profile._id })
      .sort({ submittedAt: -1, createdAt: -1 })
      .select("platform customPlatformName profileUrl creatorNote status adminNote submittedAt reviewedAt")
      .lean()
      .exec();

    return NextResponse.json({
      ok: true,
      status: profile.verificationStatus,
      verificationCode,
      verificationPlatform: profile.verificationPlatform,
      customPlatformName: profile.customPlatformName,
      verificationProfileUrl: profile.verificationProfileUrl,
      verificationSubmittedNote: profile.verificationSubmittedNote,
      verificationCodeExpiresAt: profile.verificationCodeExpiresAt?.toISOString(),
      verificationSubmittedAt: profile.verificationSubmittedAt?.toISOString(),
      verificationReviewedAt: profile.verificationReviewedAt?.toISOString(),
      verificationNote: profile.verificationNote,
      verificationRejectedReason: profile.verificationRejectedReason,
      verifiedSubscribers: profile.verifiedSubscribers,
      verifiedAverageViews: profile.verifiedAverageViews,
      verifiedEngagementRate: profile.verifiedEngagementRate,
      claimedSubscribers: profile.claimedSubscribers,
      claimedAverageViews: profile.claimedAverageViews ?? profile.avgViews,
      claimedEngagementRate: profile.claimedEngagementRate,
      statsVerificationStatus: profile.statsVerificationStatus,
      verifiedAt: profile.verifiedAt?.toISOString(),
      request: latestRequest
        ? {
            id: latestRequest._id.toString(),
            platform: latestRequest.platform,
            customPlatformName: latestRequest.customPlatformName,
            profileUrl: latestRequest.profileUrl,
            creatorNote: latestRequest.creatorNote,
            status: latestRequest.status,
            adminNote: latestRequest.adminNote,
            submittedAt: latestRequest.submittedAt?.toISOString(),
            reviewedAt: latestRequest.reviewedAt?.toISOString(),
          }
        : null,
    });
    });
  } catch (error) {
    return handleRouteError(error, "Creator verification status failed", "Could not load verification status.");
  }
}
