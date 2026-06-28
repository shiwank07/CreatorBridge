import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    if (!hasClerkKeys()) {
      return NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before checking brand verification." }, { status: 401 });
    }

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId, role: "brand" });
    if (!user) return NextResponse.json({ error: "Brand account not found." }, { status: 404 });

    const profile = await BrandProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Brand profile not found." }, { status: 404 });

    return NextResponse.json({
      ok: true,
      status: profile.verificationStatus,
      verificationMethod: profile.verificationMethod,
      verificationCode: profile.verificationCode,
      verificationSubmittedAt: profile.verificationSubmittedAt?.toISOString(),
      verificationReviewedAt: profile.verificationReviewedAt?.toISOString(),
      verificationNote: profile.verificationNote,
      rejectionReason: profile.rejectionReason,
      companyDomain: profile.companyDomain,
      normalizedWebsiteDomain: profile.normalizedWebsiteDomain,
    });
  } catch (error) {
    return handleRouteError(error, "Brand verification status failed", "Could not load brand verification status.");
  }
}
