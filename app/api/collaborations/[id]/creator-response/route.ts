import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { appendCollaborationTimeline, normalizeCollaborationStatus } from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { creatorResponseSchema } from "@/lib/validators/brand-inquiry";

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
    const parsed = creatorResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid creator response." }, { status: 400 });
    }

    await connectDB();
    const collaboration = await BrandInquiry.findById(id);
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });

    let creatorUserForNotification: { email: string; name: string; username: string } | null = null;

    if (hasClerkKeys()) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Sign in before responding to collaboration requests." }, { status: 401 });

      const user = await User.findOne({ clerkId: userId });
      if (!user) return NextResponse.json({ error: "Creator account not found." }, { status: 404 });
      creatorUserForNotification = { email: user.email, name: user.name, username: user.username };

      const creatorProfile = await CreatorProfile.findOne({ userId: user._id });
      const ownsCollaboration =
        idsMatch(collaboration.creatorUserId, user._id) ||
        idsMatch(collaboration.creatorProfileId, creatorProfile?._id) ||
        collaboration.creatorUsername === user.username;

      if (!ownsCollaboration) {
        return NextResponse.json({ error: "You can only respond to your own collaboration requests." }, { status: 403 });
      }
    }

    const currentStatus = normalizeCollaborationStatus(collaboration.status);
    if (!["NEW", "PENDING_CREATOR_RESPONSE"].includes(currentStatus)) {
      return NextResponse.json({ error: "This collaboration offer is not waiting for a creator response." }, { status: 400 });
    }

    const now = new Date();
    const action =
      parsed.data.action === "interested" ? "accept_offer" : parsed.data.action === "decline" ? "decline_offer" : parsed.data.action;
    const currentOfferAmount = collaboration.currentOfferAmount || collaboration.initialOfferAmount || 0;
    collaboration.offerHistory = collaboration.offerHistory ?? [];

    if (action === "accept_offer") {
      const note = parsed.data.note || "Offer accepted by creator.";
      collaboration.set({
        status: "ACCEPTED",
        creatorResponseAt: now,
        creatorResponseNote: note,
      });
      appendCollaborationTimeline(collaboration, {
        event: "ACCEPTED",
        status: "ACCEPTED",
        actor: "creator",
        note,
        createdAt: now,
      });
      collaboration.offerHistory.push({
        actor: "creator",
        action: "offer_accepted",
        amount: currentOfferAmount,
        currency: "INR",
        note,
        createdAt: now,
      });
    }

    if (action === "decline_offer") {
      const note = parsed.data.note || "Offer declined by creator.";
      collaboration.set({
        status: "DECLINED",
        creatorResponseAt: now,
        creatorResponseNote: note,
        closedAt: now,
      });
      appendCollaborationTimeline(collaboration, {
        event: "DECLINED",
        status: "DECLINED",
        actor: "creator",
        note,
        createdAt: now,
      });
      collaboration.offerHistory.push({
        actor: "creator",
        action: "offer_declined",
        amount: currentOfferAmount,
        currency: "INR",
        note,
        createdAt: now,
      });
    }

    if (action === "request_revision") {
      if (!collaboration.isNegotiable) {
        return NextResponse.json({ error: "This offer was marked as non-negotiable by the brand." }, { status: 400 });
      }

      const note = parsed.data.counterOfferNote;
      const amount = parsed.data.counterOfferAmount ?? 0;
      collaboration.set({
        status: "REVISION_REQUESTED",
        currentOfferAmount: amount,
        creatorResponseAt: now,
        creatorResponseNote: note,
      });
      appendCollaborationTimeline(collaboration, {
        event: "REVISION_REQUESTED",
        status: "REVISION_REQUESTED",
        actor: "creator",
        note,
        createdAt: now,
      });
      collaboration.offerHistory.push({
        actor: "creator",
        action: "counter_requested",
        amount,
        currency: "INR",
        note,
        createdAt: now,
      });
    }

    await collaboration.save();

    if (action === "accept_offer") {
      await notificationService.notifyCreatorAccepted({ collaboration, creatorUser: creatorUserForNotification, note: parsed.data.note });
    }

    if (action === "decline_offer") {
      await notificationService.notifyCreatorDeclined({ collaboration, creatorUser: creatorUserForNotification, note: parsed.data.note });
    }

    if (action === "request_revision") {
      await notificationService.notifyCreatorCounterRequested({
        collaboration,
        creatorUser: creatorUserForNotification,
        amount: parsed.data.counterOfferAmount,
        note: parsed.data.counterOfferNote,
      });
    }

    return NextResponse.json({ ok: true, status: collaboration.status });
  } catch (error) {
    return handleRouteError(error, "Creator response failed", "Could not respond to the collaboration request.");
  }
}
