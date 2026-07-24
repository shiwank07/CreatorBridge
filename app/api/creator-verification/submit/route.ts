import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { createVerificationCode, verificationCodeExpiry } from "@/lib/verification-helpers";

async function generateUniqueCreatorCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = createVerificationCode();
    const existing = await CreatorProfile.exists({ verificationCode: code });
    if (!existing) return code;
  }

  throw new Error("Could not allocate a unique verification code.");
}

const creatorVerificationSubmitSchema = z
  .object({
    platform: z.enum(["youtube", "instagram", "twitch", "x", "other"]),
    customPlatformName: z.string().trim().max(80).optional().default(""),
    profileUrl: z.string().trim().url("Enter a valid public profile URL.").max(500).refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    }, "Profile URL must use http or https."),
    note: z.string().trim().max(500).optional().default(""),
  })
  .superRefine((value, context) => {
    if (value.platform === "other" && value.customPlatformName.trim().length < 2) {
      context.addIssue({
        code: "custom",
        message: "Specify the other platform.",
        path: ["customPlatformName"],
      });
    }
  })
  .transform((value) => ({
    ...value,
    customPlatformName: value.platform === "other" ? value.customPlatformName.trim() : "",
  }));

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
    if (profile.verificationStatus === "verified" || profile.verificationStatus === "ownership_verified") {
      return NextResponse.json({ error: "This creator is already verified." }, { status: 409 });
    }
    if (await CreatorVerificationRequest.exists({ creatorId: profile._id, status: "pending" })) {
      return NextResponse.json({ error: "A verification request is already pending review." }, { status: 409 });
    }

    const now = new Date();
    const verificationCode =
      profile.verificationCode
        ? profile.verificationCode
        : await generateUniqueCreatorCode();

    let request;
    try {
      request = await CreatorVerificationRequest.create({
        creatorId: profile._id,
        clerkUserId: userId,
        platform: parsed.data.platform,
        customPlatformName: parsed.data.customPlatformName,
        profileUrl: parsed.data.profileUrl,
        verificationCode,
        creatorNote: parsed.data.note,
        status: "pending",
        submittedAt: now,
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 11000) {
        return NextResponse.json({ error: "A verification request is already pending review." }, { status: 409 });
      }
      throw error;
    }

    await CreatorProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          verificationStatus: "pending",
          verificationCode,
          verificationCodeExpiresAt: profile.verificationCodeExpiresAt ?? verificationCodeExpiry(),
          verificationPlatform: parsed.data.platform,
          customPlatformName: parsed.data.customPlatformName,
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

    await notificationService.notifyVerificationSubmitted({
      user,
      platform: parsed.data.platform === "other" ? parsed.data.customPlatformName : parsed.data.platform,
      profileUrl: parsed.data.profileUrl,
    });

    return NextResponse.json({ ok: true, requestId: request._id.toString(), status: "pending", verificationCode }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Creator verification submission failed", "Could not submit verification.");
  }
}
