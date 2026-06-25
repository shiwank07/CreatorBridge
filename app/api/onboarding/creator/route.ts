import { auth, currentUser } from "@clerk/nextjs/server";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { connectDB, hasMongoUri } from "@/lib/db";
import { hasClerkKeys } from "@/lib/clerk-config";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { creatorOnboardingSchema } from "@/lib/validators/creator";

const VERIFICATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createVerificationCode() {
  let suffix = "";

  for (let index = 0; index < 5; index += 1) {
    suffix += VERIFICATION_CODE_ALPHABET[randomInt(VERIFICATION_CODE_ALPHABET.length)];
  }

  return `CB-${suffix}`;
}

async function generateUniqueVerificationCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = createVerificationCode();
    const existing = await CreatorProfile.exists({ verificationCode: code });

    if (!existing) return code;
  }

  return `CB-${Date.now().toString(36).slice(-5).toUpperCase()}`;
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

    const clerkUser = await currentUser();
    const email =
      clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      `${userId}@creatorbridge.local`;

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          email,
          username: parsed.data.username,
          name: parsed.data.name,
          avatar: parsed.data.avatar || clerkUser?.imageUrl || "",
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
    const hasYoutubeUrl = Boolean(parsed.data.youtubeUrl);
    const verificationCode = hasYoutubeUrl
      ? existingProfile?.verificationCode || (await generateUniqueVerificationCode())
      : "";

    await CreatorProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          bio: parsed.data.bio,
          niche: parsed.data.niche,
          country: parsed.data.country,
          languages: parsed.data.languages,
          youtubeUrl: parsed.data.youtubeUrl,
          youtubeHandle: parsed.data.youtubeHandle,
          subscribers: parsed.data.subscribers,
          claimedSubscribers: parsed.data.subscribers,
          verificationStatus: hasYoutubeUrl ? existingProfile?.verificationStatus ?? "unverified" : "unverified",
          verificationCode,
          ...(!hasYoutubeUrl
            ? {
                verifiedSubscribers: 0,
                verificationNote: "",
                lastVerifiedAt: null,
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

    return NextResponse.json({
      ok: true,
      username: parsed.data.username,
      verificationCode: verificationCode || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "Creator onboarding failed", "Could not save your creator profile.");
  }
}
