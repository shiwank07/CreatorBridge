import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { createVerificationCode, verificationCodeExpiry } from "@/lib/verification-helpers";

async function generateUniqueCreatorCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = createVerificationCode();
    const existing = await CreatorProfile.exists({ verificationCode: code });
    if (!existing) return code;
  }

  return `CB-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export async function POST() {
  try {
    if (!hasClerkKeys()) {
      return NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before submitting verification." }, { status: 401 });
    }

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId, role: "creator" });
    if (!user) return NextResponse.json({ error: "Creator account not found." }, { status: 404 });

    const profile = await CreatorProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    if (!profile.youtubeUrl) {
      return NextResponse.json({ error: "Add a YouTube URL before submitting verification." }, { status: 400 });
    }
    if (profile.verificationStatus === "stats_verified") {
      return NextResponse.json({ ok: true, status: profile.verificationStatus });
    }

    const now = new Date();
    const isExpired = profile.verificationCodeExpiresAt ? profile.verificationCodeExpiresAt < now : false;
    const verificationCode = profile.verificationCode && !isExpired ? profile.verificationCode : await generateUniqueCreatorCode();

    await CreatorProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          verificationStatus: "pending_ownership",
          verificationCode,
          verificationCodeExpiresAt: isExpired || !profile.verificationCodeExpiresAt ? verificationCodeExpiry() : profile.verificationCodeExpiresAt,
          verificationSubmittedAt: now,
          verificationReviewedAt: null,
          verificationReviewedByAdminId: "",
          verificationRejectedReason: "",
          verificationNote: "",
        },
      },
    );

    return NextResponse.json({ ok: true, status: "pending_ownership", verificationCode });
  } catch (error) {
    return handleRouteError(error, "Creator verification submission failed", "Could not submit verification.");
  }
}
