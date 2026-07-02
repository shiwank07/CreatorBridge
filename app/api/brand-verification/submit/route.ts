import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";
import { emailDomain, normalizeUrlDomain } from "@/lib/verification-helpers";

const brandVerificationSubmitSchema = z.object({
  website: z.string().trim().url("Enter a valid company website URL.").max(500),
  contactEmail: z.string().trim().email("Enter a valid work email.").max(160),
  companyRegistrationText: z.string().trim().max(500).optional().default(""),
});

export async function POST(req: Request) {
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

    const body = await parseJsonBody(req);
    const parsed = brandVerificationSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid brand verification request." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId, role: "brand" });
    if (!user) return NextResponse.json({ error: "Brand account not found." }, { status: 404 });

    const profile = await BrandProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Brand profile not found." }, { status: 404 });
    if (profile.verificationStatus === "verified") {
      return NextResponse.json({ ok: true, status: profile.verificationStatus });
    }

    const companyDomain = emailDomain(parsed.data.contactEmail);
    const normalizedWebsiteDomain = normalizeUrlDomain(parsed.data.website);

    await BrandProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          website: parsed.data.website,
          contactEmail: parsed.data.contactEmail,
          companyRegistrationText: parsed.data.companyRegistrationText,
          verificationStatus: "pending",
          verificationMethod: "manual",
          verificationCode: "",
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

    return NextResponse.json({ ok: true, status: "pending", verificationMethod: "manual" });
  } catch (error) {
    return handleRouteError(error, "Brand verification submission failed", "Could not submit brand verification.");
  }
}
