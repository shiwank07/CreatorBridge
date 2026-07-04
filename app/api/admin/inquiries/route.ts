import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import {
  appendCollaborationTimeline,
  collaborationStatusLabel,
  type CollaborationStatus,
  type CollaborationTimelineEvent,
} from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { getAdminInquiries } from "@/lib/queries/admin";
import { inquiryStatusSchema } from "@/lib/validators/brand-inquiry";

const ADMIN_STATUS_EVENT_MAP: Record<CollaborationStatus, CollaborationTimelineEvent> = {
  NEW: "CREATED",
  PENDING_CREATOR_RESPONSE: "VIEWED",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  IN_PROGRESS: "IN_PROGRESS",
  PROOF_SUBMITTED: "PROOF_SUBMITTED",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  APPROVED: "APPROVED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const inquiries = await getAdminInquiries();
  return NextResponse.json({ inquiries });
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = inquiryStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid collaboration update." }, { status: 400 });
    }

    await connectDB();
    const collaboration = await BrandInquiry.findById(parsed.data.id);
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });

    collaboration.set({ status: parsed.data.status });
    appendCollaborationTimeline(collaboration, {
      event: ADMIN_STATUS_EVENT_MAP[parsed.data.status],
      status: parsed.data.status,
      actor: "admin",
      note: `Admin set status to ${collaborationStatusLabel(parsed.data.status)}.`,
    });
    await collaboration.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin collaboration update failed", "Could not update the collaboration.");
  }
}
