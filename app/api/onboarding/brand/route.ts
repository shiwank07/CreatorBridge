import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";
import { ensureUniqueUsername } from "@/lib/queries/creators";
import { brandOnboardingSchema } from "@/lib/validators/brand-profile";
import { emailDomain, normalizeUrlDomain } from "@/lib/verification-helpers";

function getClerkEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    ""
  );
}

export async function POST(req: Request) {
  try {
    if (!hasClerkKeys()) {
      return NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before creating a brand profile." }, { status: 401 });
    }

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = brandOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid brand profile." }, { status: 400 });
    }

    await connectDB();

    const clerkUser = await currentUser();
    const clerkEmail = getClerkEmail(clerkUser);
    const userEmail = clerkEmail || parsed.data.contactEmail || `${userId}@creatorbridge.local`;
    const existingUser = await User.findOne({ clerkId: userId });
    const username = existingUser?.username ?? (await ensureUniqueUsername(parsed.data.companyName, userId));

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          email: userEmail,
          username,
          name: parsed.data.contactName,
          avatar: clerkUser?.imageUrl || existingUser?.avatar || "",
          role: "brand",
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

    const existingProfile = await BrandProfile.findOne({ userId: user._id });
    const companyDomain = emailDomain(parsed.data.contactEmail);
    const normalizedWebsiteDomain = normalizeUrlDomain(parsed.data.website);
    const brandIdentityChanged = Boolean(
      existingProfile &&
        (existingProfile.contactEmail !== parsed.data.contactEmail ||
          existingProfile.website !== parsed.data.website ||
          existingProfile.companyName !== parsed.data.companyName),
    );

    const profile = await BrandProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          companyName: parsed.data.companyName,
          contactName: parsed.data.contactName,
          contactRole: parsed.data.contactRole,
          contactEmail: parsed.data.contactEmail,
          website: parsed.data.website,
          industry: parsed.data.industry,
          companySize: parsed.data.companySize,
          country: parsed.data.country,
          notes: parsed.data.notes,
          companyDomain,
          normalizedWebsiteDomain,
          verificationStatus: brandIdentityChanged ? "unverified" : existingProfile?.verificationStatus ?? "unverified",
          ...(brandIdentityChanged
            ? {
                verificationSubmittedAt: null,
                verificationReviewedAt: null,
                verificationReviewedByAdminId: "",
                verificationNote: "",
                rejectionReason: "",
              }
            : {}),
        },
      },
      { upsert: true, new: true },
    );

    if (brandIdentityChanged) {
      await User.updateOne({ _id: user._id }, { $set: { isVerified: false } });
    }

    return NextResponse.json({
      ok: true,
      profileId: profile._id.toString(),
      companyName: profile.companyName,
      username,
    });
  } catch (error) {
    return handleRouteError(error, "Brand onboarding failed", "Could not save your brand profile.");
  }
}
