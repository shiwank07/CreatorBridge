import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { brandInquirySchema } from "@/lib/validators/brand-inquiry";

export async function POST(req: Request) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    if (!hasClerkKeys()) {
      return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = brandInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid collaboration request." }, { status: 400 });
    }

    await connectDB();
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Sign in with a brand account before starting a collaboration." }, { status: 401 });
    }

    const brandUser = await User.findOne({ clerkId });
    if (!brandUser?.onboardingComplete) {
      return NextResponse.json({ error: "Complete brand onboarding before starting a collaboration." }, { status: 403 });
    }

    if (brandUser.role !== "brand") {
      return NextResponse.json({ error: "Only brand accounts can start collaborations." }, { status: 403 });
    }

    const brandProfile = brandUser ? await BrandProfile.findOne({ userId: brandUser._id }) : null;
    if (!brandProfile) {
      return NextResponse.json({ error: "Create your brand profile before starting a collaboration." }, { status: 403 });
    }

    if (!parsed.data.creatorUsername) {
      return NextResponse.json({ error: "Choose a creator before starting a collaboration." }, { status: 400 });
    }

    const creatorUser = parsed.data.creatorUsername
      ? await User.findOne({ username: parsed.data.creatorUsername, role: "creator" })
      : null;
    if (!creatorUser?.onboardingComplete) {
      return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    }

    const creatorProfile = creatorUser ? await CreatorProfile.findOne({ userId: creatorUser._id }) : null;
    if (!creatorProfile) {
      return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    }

    const now = new Date();
    const budgetRange = parsed.data.budgetRange || formatINR(parsed.data.initialOfferAmount);
    const inquiryPayload: Record<string, unknown> = {
      ...parsed.data,
      budgetRange,
      isNegotiable: false,
      currency: "INR",
      currentOfferAmount: parsed.data.initialOfferAmount,
      status: "PENDING_CREATOR_RESPONSE",
      statusHistory: [
        {
          event: "CREATED",
          status: "PENDING_CREATOR_RESPONSE",
          actor: "brand",
          note: "Brand created the collaboration request.",
          createdAt: now,
        },
      ],
      offerHistory: [
        {
          actor: "brand",
          action: "offer_sent",
          amount: parsed.data.initialOfferAmount,
          currency: "INR",
          note: "Initial offer",
          createdAt: now,
        },
      ],
      createdByClerkId: clerkId,
      source: parsed.data.creatorUsername ? "creator_profile" : "general_form",
    };

    if (brandUser) inquiryPayload.brandUserId = brandUser._id;
    if (brandProfile) inquiryPayload.brandProfileId = brandProfile._id;
    if (creatorUser) inquiryPayload.creatorUserId = creatorUser._id;
    if (creatorProfile) inquiryPayload.creatorProfileId = creatorProfile._id;

    const inquiry = await BrandInquiry.create(inquiryPayload);

    if (parsed.data.creatorUsername || creatorUser) {
      await notificationService.notifyNewCollaboration({ collaboration: inquiry, creatorUser });
    }

    return NextResponse.json({ ok: true, id: inquiry._id.toString() }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Collaboration request failed", "Could not start the collaboration.");
  }
}
