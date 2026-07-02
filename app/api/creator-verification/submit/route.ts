import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
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

  return `HALO-${Date.now().toString().slice(-6)}`;
}

const creatorVerificationSubmitSchema = z.object({
  platform: z.enum(["youtube", "instagram", "twitch", "other"]),
  profileUrl: z.string().trim().url("Enter a valid public profile URL.").max(500),
  note: z.string().trim().max(500).optional().default(""),
});

export async function POST(req: Request) {
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

    const body = await parseJsonBody(req);
    const parsed = creatorVerificationSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid verification request." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId, role: "creator" });
    if (!user) return NextResponse.json({ error: "Creator account not found." }, { status: 404 });

    const profile = await CreatorProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    if (profile.verificationStatus === "verified" || profile.verificationStatus === "stats_verified") {
      return NextResponse.json({ ok: true, status: profile.verificationStatus });
    }

    const now = new Date();
    const isExpired = profile.verificationCodeExpiresAt ? profile.verificationCodeExpiresAt < now : false;
    const verificationCode = profile.verificationCode && !isExpired ? profile.verificationCode : await generateUniqueCreatorCode();

    await CreatorProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          verificationStatus: "pending",
          verificationCode,
          verificationCodeExpiresAt: isExpired || !profile.verificationCodeExpiresAt ? verificationCodeExpiry() : profile.verificationCodeExpiresAt,
          verificationPlatform: parsed.data.platform,
          verificationProfileUrl: parsed.data.profileUrl,
          verificationSubmittedNote: parsed.data.note,
          verificationSubmittedAt: now,
          verificationReviewedAt: null,
          verificationReviewedByAdminId: "",
          verificationRejectedReason: "",
          verificationNote: "",
        },
      },
    );

    return NextResponse.json({ ok: true, status: "pending", verificationCode });
  } catch (error) {
    return handleRouteError(error, "Creator verification submission failed", "Could not submit verification.");
  }
}
