import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { appendCollaborationTimeline, normalizeCollaborationStatus } from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";

function idsMatch(value: unknown, id: unknown) {
  return Boolean(value && id && value.toString() === id.toString());
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    if (!hasClerkKeys()) return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });

    const { id } = await params;
    const body = await parseJsonBody(req).catch(() => ({}));
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in before cancelling a collaboration." }, { status: 401 });

    await connectDB();
    const [user, collaboration] = await Promise.all([
      User.findOne({ clerkId: userId }).exec(),
      BrandInquiry.findById(id).exec(),
    ]);

    if (!user || user.role !== "brand") {
      return NextResponse.json({ error: "Only the brand can cancel a pending collaboration request." }, { status: 403 });
    }
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });

    const brandProfile = await BrandProfile.findOne({ userId: user._id }).select("_id contactEmail").exec();
    const ownsCollaboration =
      collaboration.createdByClerkId === user.clerkId ||
      idsMatch(collaboration.brandUserId, user._id) ||
      idsMatch(collaboration.brandProfileId, brandProfile?._id) ||
      (brandProfile?.contactEmail ? collaboration.email === brandProfile.contactEmail : false);

    if (!ownsCollaboration) {
      return NextResponse.json({ error: "You can only cancel your own collaboration requests." }, { status: 403 });
    }

    const currentStatus = normalizeCollaborationStatus(collaboration.status);
    if (currentStatus !== "NEW" && currentStatus !== "PENDING_CREATOR_RESPONSE") {
      return NextResponse.json(
        { error: "Cancellation after acceptance or work start requires dispute/admin review." },
        { status: 400 },
      );
    }

    const now = new Date();
    collaboration.set({
      status: "CANCELLED",
      closedAt: now,
      creatorResponseNote: note || "Brand cancelled before creator acceptance.",
    });
    appendCollaborationTimeline(collaboration, {
      event: "CANCELLED",
      status: "CANCELLED",
      actor: "brand",
      note: note || "Brand cancelled before creator acceptance.",
      createdAt: now,
    });
    await collaboration.save();

    return NextResponse.json({ ok: true, status: collaboration.status });
  } catch (error) {
    return handleRouteError(error, "Collaboration cancellation failed", "Could not cancel the collaboration.");
  }
}
