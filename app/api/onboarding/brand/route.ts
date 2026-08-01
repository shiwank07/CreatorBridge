import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { getClerkEmailVerificationState } from "@/lib/clerk-verification";
import { connectDB, hasMongoUri } from "@/lib/db";
import { sendBrandWelcomeOnce } from "@/lib/email/welcome-emails";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";
import { ensureUniqueUsername } from "@/lib/queries/creators";
import { brandOnboardingSchema } from "@/lib/validators/brand-profile";
import { emailDomain, normalizeUrlDomain } from "@/lib/verification-helpers";
import { onboardingRoleFilter } from "@/lib/onboarding-role";

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
    const userEmail = clerkEmail || parsed.data.contactEmail || `${userId}@branzzo.local`;
    const emailVerified = Boolean(getClerkEmailVerificationState(clerkUser, userEmail)?.verified);
    const existingUser = await User.findOne({ clerkId: userId });
    const username = existingUser?.username ?? (await ensureUniqueUsername(parsed.data.companyName, userId));
    const phoneVerified = Boolean(existingUser?.phoneVerified && (existingUser.phoneNumber ?? "") === parsed.data.phoneNumber);
    const phoneVerifiedAt = phoneVerified ? existingUser?.phoneVerifiedAt ?? null : null;

    let user;
    try {
      user = await User.findOneAndUpdate(
      onboardingRoleFilter(userId, "brand"),
      {
        $set: {
          email: userEmail,
          emailVerified,
          username,
          name: parsed.data.contactName,
          phoneNumber: parsed.data.phoneNumber,
          phoneVerified,
          phoneVerifiedAt,
          // Clerk owns the image; MongoDB keeps only its current URL for public queries.
          avatar: clerkUser?.imageUrl ?? parsed.data.logo,
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
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 11000) {
        return NextResponse.json({ error: "This account already has a different completed role." }, { status: 403 });
      }
      throw error;
    }
    if (!user) return NextResponse.json({ error: "This account cannot complete brand onboarding." }, { status: 403 });

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
          phoneNumber: parsed.data.phoneNumber,
          phoneVerified,
          phoneVerifiedAt,
          website: parsed.data.website,
          industry: parsed.data.industry,
          companySize: parsed.data.companySize,
          country: parsed.data.country,
          companyRegistrationText: parsed.data.companyRegistrationText,
          notes: parsed.data.notes,
          displayPublicly: parsed.data.displayPublicly,
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

    await sendBrandWelcomeOnce({
      to: user.email,
      firstName: user.name.split(/\s+/)[0],
      userId: user._id.toString(),
      idempotencyKey: `welcome:brand:${user._id}`,
    }).catch(() => console.error("[email] Brand welcome delivery could not be recorded."));

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
