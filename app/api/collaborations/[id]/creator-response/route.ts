import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { normalizeCollaborationStatus } from "@/lib/collaborations";
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
    if (!["new", "viewed"].includes(currentStatus)) {
      return NextResponse.json({ error: "This collaboration request has already been responded to." }, { status: 400 });
    }

    const now = new Date();
    const note = parsed.data.note || (parsed.data.action === "interested" ? "Interested" : "Declined by creator");

    if (parsed.data.action === "interested") {
      collaboration.set({
        status: "interested",
        creatorResponseAt: now,
        creatorResponseNote: note,
      });
    } else {
      collaboration.set({
        status: "closed",
        creatorResponseAt: now,
        creatorResponseNote: note,
        closedAt: now,
      });
    }

    await collaboration.save();

    if (parsed.data.action === "interested") {
      await notificationService.notifyCreatorAccepted({ collaboration, creatorUser: creatorUserForNotification, note });
    } else {
      await notificationService.notifyCreatorDeclined({ collaboration, creatorUser: creatorUserForNotification, note });
    }

    return NextResponse.json({ ok: true, status: collaboration.status });
  } catch (error) {
    return handleRouteError(error, "Creator response failed", "Could not respond to the collaboration request.");
  }
}
