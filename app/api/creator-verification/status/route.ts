import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";

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

    await connectDB();

    const user = await User.findOne({ clerkId: userId, role: "creator" });
    if (!user) return NextResponse.json({ error: "Creator account not found." }, { status: 404 });

    const profile = await CreatorProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });

    return NextResponse.json({
      ok: true,
      status: profile.verificationStatus,
      verificationCode: profile.verificationCode,
      verificationPlatform: profile.verificationPlatform,
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
    });
  } catch (error) {
    return handleRouteError(error, "Creator verification status failed", "Could not load verification status.");
  }
}
