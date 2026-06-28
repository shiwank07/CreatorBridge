import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";
import { createVerificationCode, emailDomain, isWorkEmailDomain, normalizeUrlDomain } from "@/lib/verification-helpers";

async function generateUniqueBrandCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = createVerificationCode("CB-B");
    const existing = await BrandProfile.exists({ verificationCode: code });
    if (!existing) return code;
  }

  return `CB-B-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export async function POST() {
  try {
    if (!hasClerkKeys()) {
      return NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before submitting brand verification." }, { status: 401 });
    }

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId, role: "brand" });
    if (!user) return NextResponse.json({ error: "Brand account not found." }, { status: 404 });

    const profile = await BrandProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Brand profile not found." }, { status: 404 });
    if (profile.verificationStatus === "verified") {
      return NextResponse.json({ ok: true, status: profile.verificationStatus });
    }

    const companyDomain = profile.companyDomain || emailDomain(profile.contactEmail);
    const normalizedWebsiteDomain = profile.normalizedWebsiteDomain || normalizeUrlDomain(profile.website);
    const verificationMethod =
      companyDomain && normalizedWebsiteDomain && companyDomain === normalizedWebsiteDomain && isWorkEmailDomain(companyDomain)
        ? "work_email_domain"
        : profile.website
          ? "website_code"
          : "manual";
    const verificationCode = profile.verificationCode || (await generateUniqueBrandCode());

    await BrandProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          verificationStatus: "pending",
          verificationMethod,
          verificationCode,
          companyDomain,
          normalizedWebsiteDomain,
          verificationSubmittedAt: new Date(),
          verificationReviewedAt: null,
          verificationReviewedByAdminId: "",
          verificationNote: "",
          rejectionReason: "",
        },
      },
    );

    return NextResponse.json({ ok: true, status: "pending", verificationCode, verificationMethod });
  } catch (error) {
    return handleRouteError(error, "Brand verification submission failed", "Could not submit brand verification.");
  }
}
