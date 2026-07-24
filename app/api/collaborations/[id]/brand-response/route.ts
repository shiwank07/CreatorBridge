import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { appendCollaborationTimeline, normalizeCollaborationStatus } from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { brandNegotiationResponseSchema } from "@/lib/validators/brand-inquiry";

function idsMatch(value: unknown, id: unknown) {
  return Boolean(value && id && value.toString() === id.toString());
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    if (!hasClerkKeys()) return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });

    const parsed = brandNegotiationResponseSchema.safeParse(await parseJsonBody(req));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in before responding to a counter offer." }, { status: 401 });

    await connectDB();
    const [{ id }, user] = await Promise.all([params, User.findOne({ clerkId: userId, role: "brand" })]);
    if (!user) return NextResponse.json({ error: "Brand account not found." }, { status: 403 });
    const [collaboration, brandProfile] = await Promise.all([
      BrandInquiry.findById(id),
      BrandProfile.findOne({ userId: user._id }).select("_id"),
    ]);
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });
    if (!idsMatch(collaboration.brandUserId, user._id) && !idsMatch(collaboration.brandProfileId, brandProfile?._id) && collaboration.createdByClerkId !== userId) {
      return NextResponse.json({ error: "You can only negotiate your own collaborations." }, { status: 403 });
    }
    if (normalizeCollaborationStatus(collaboration.status) !== "NEGOTIATING" || collaboration.offerHistory?.at(-1)?.actor !== "creator") {
      return NextResponse.json({ error: "No creator counter offer is waiting for your response." }, { status: 409 });
    }

    const now = new Date();
    const currentAmount = collaboration.currentOfferAmount || 0;
    if (parsed.data.action === "accept_counter") {
      collaboration.set({ status: "ACCEPTED", currentStage: "Accepted", creatorStatus: "accepted", brandStatus: "accepted" });
      appendCollaborationTimeline(collaboration, { event: "ACCEPTED", status: "ACCEPTED", actor: "brand", note: parsed.data.note || "Brand accepted the creator counter offer.", createdAt: now });
      collaboration.offerHistory.push({ actor: "brand", action: "offer_accepted", amount: currentAmount, currency: "INR", note: parsed.data.note, createdAt: now });
    } else if (parsed.data.action === "reject_counter") {
      collaboration.set({ status: "DECLINED", currentStage: "Rejected", brandStatus: "rejected", creatorStatus: "rejected", closedAt: now });
      appendCollaborationTimeline(collaboration, { event: "DECLINED", status: "DECLINED", actor: "brand", note: parsed.data.note, createdAt: now });
      collaboration.offerHistory.push({ actor: "brand", action: "offer_declined", amount: currentAmount, currency: "INR", note: parsed.data.note, createdAt: now });
    } else {
      const amount = parsed.data.amount ?? 0;
      collaboration.set({ status: "NEGOTIATING", currentStage: "Negotiating", negotiationPrice: amount, currentOfferAmount: amount, brandStatus: "countered", creatorStatus: "response_required" });
      appendCollaborationTimeline(collaboration, { event: "COUNTERED", status: "NEGOTIATING", actor: "brand", note: parsed.data.note, createdAt: now });
      collaboration.offerHistory.push({ actor: "brand", action: "counter_sent", amount, currency: "INR", note: parsed.data.note, createdAt: now });
    }
    await collaboration.save();

    if (parsed.data.action === "accept_counter") {
      await notificationService.notifyCounterDecision({ collaboration, accepted: true });
    } else if (parsed.data.action === "reject_counter") {
      await notificationService.notifyCounterDecision({ collaboration, accepted: false });
    } else {
      await notificationService.notifyCounterOffer({ collaboration, actor: "brand", amount: parsed.data.amount ?? 0, note: parsed.data.note });
    }
    return NextResponse.json({ ok: true, status: collaboration.status, amount: collaboration.currentOfferAmount });
  } catch (error) {
    return handleRouteError(error, "Brand negotiation response failed", "Could not respond to the counter offer.");
  }
}
