import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { normalizeCollaborationStatus } from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { brandResponseSchema } from "@/lib/validators/brand-inquiry";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function idsMatch(value: unknown, id: unknown) {
  return Boolean(value && id && value.toString() === id.toString());
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const { id } = await params;
    const body = await parseJsonBody(req);
    const parsed = brandResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid brand response." }, { status: 400 });
    }

    await connectDB();
    const collaboration = await BrandInquiry.findById(id);
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });

    if (hasClerkKeys()) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Sign in before responding to this negotiation." }, { status: 401 });

      const user = await User.findOne({ clerkId: userId });
      if (!user) return NextResponse.json({ error: "Brand account not found." }, { status: 404 });

      const brandProfile = await BrandProfile.findOne({ userId: user._id });
      const ownsCollaboration =
        collaboration.createdByClerkId === user.clerkId ||
        idsMatch(collaboration.brandUserId, user._id) ||
        idsMatch(collaboration.brandProfileId, brandProfile?._id) ||
        (brandProfile?.contactEmail ? collaboration.email === brandProfile.contactEmail : false);

      if (!ownsCollaboration) {
        return NextResponse.json({ error: "You can only respond to negotiations for your own collaborations." }, { status: 403 });
      }
    }

    const currentStatus = normalizeCollaborationStatus(collaboration.status);
    if (currentStatus !== "counter_requested") {
      return NextResponse.json({ error: "This collaboration is not waiting on a brand negotiation response." }, { status: 400 });
    }

    const now = new Date();
    const currentOfferAmount = collaboration.currentOfferAmount || 0;
    collaboration.offerHistory = collaboration.offerHistory ?? [];

    if (parsed.data.action === "accept_counter") {
      if (currentOfferAmount <= 0) {
        return NextResponse.json({ error: "No creator counter offer amount is available." }, { status: 400 });
      }

      const note = parsed.data.note || "Brand accepted the creator counter offer.";
      collaboration.set({
        status: "offer_accepted",
        currentOfferAmount,
      });
      collaboration.offerHistory.push({
        actor: "brand",
        action: "offer_accepted",
        amount: currentOfferAmount,
        currency: "INR",
        note,
        createdAt: now,
      });
    }

    if (parsed.data.action === "send_revised_offer") {
      const amount = parsed.data.revisedOfferAmount ?? 0;
      const note = parsed.data.note || "Brand sent a revised offer.";
      collaboration.set({
        status: "counter_sent",
        currentOfferAmount: amount,
      });
      collaboration.offerHistory.push({
        actor: "brand",
        action: "counter_sent",
        amount,
        currency: "INR",
        note,
        createdAt: now,
      });
    }

    if (parsed.data.action === "decline_negotiation") {
      const note = parsed.data.note || "Brand declined the negotiation.";
      collaboration.set({
        status: "offer_declined",
        closedAt: now,
      });
      collaboration.offerHistory.push({
        actor: "brand",
        action: "offer_declined",
        amount: currentOfferAmount,
        currency: "INR",
        note,
        createdAt: now,
      });
    }

    await collaboration.save();

    await notificationService.notifyBrandNegotiationResponse({
      collaboration,
      action: parsed.data.action,
      amount: parsed.data.revisedOfferAmount ?? currentOfferAmount,
      note: parsed.data.note,
    });

    return NextResponse.json({ ok: true, status: collaboration.status });
  } catch (error) {
    return handleRouteError(error, "Brand negotiation response failed", "Could not respond to this negotiation.");
  }
}
