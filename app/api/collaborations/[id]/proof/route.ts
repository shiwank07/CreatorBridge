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
import { deliveryProofSchema } from "@/lib/validators/brand-inquiry";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type DeliveryProofShape = {
  videoUrl?: string;
  timestampStart?: string;
  timestampEnd?: string;
  notes?: string;
  screenshotUrl?: string;
  referenceLink?: string;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewNote?: string;
  issueNote?: string;
  issueReportedAt?: Date | null;
  issueStatus?: "open" | "resolved" | "dismissed";
  issueReviewedAt?: Date | null;
  issueReviewedByAdminId?: string;
};

function idsMatch(value: unknown, id: unknown) {
  return Boolean(value && id && value.toString() === id.toString());
}

function plainProof(proof?: DeliveryProofShape | null) {
  return {
    videoUrl: proof?.videoUrl ?? "",
    timestampStart: proof?.timestampStart ?? "",
    timestampEnd: proof?.timestampEnd ?? "",
    notes: proof?.notes ?? "",
    screenshotUrl: proof?.screenshotUrl ?? "",
    referenceLink: proof?.referenceLink ?? proof?.screenshotUrl ?? "",
    submittedAt: proof?.submittedAt ?? null,
    reviewedAt: proof?.reviewedAt ?? null,
    reviewNote: proof?.reviewNote ?? "",
    issueNote: proof?.issueNote ?? "",
    issueReportedAt: proof?.issueReportedAt ?? null,
    issueStatus: proof?.issueStatus ?? "open",
    issueReviewedAt: proof?.issueReviewedAt ?? null,
    issueReviewedByAdminId: proof?.issueReviewedByAdminId ?? "",
  };
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const { id } = await params;
    const body = await parseJsonBody(req);
    const parsed = deliveryProofSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid delivery proof." }, { status: 400 });
    }

    await connectDB();
    const collaboration = await BrandInquiry.findById(id);
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });

    if (hasClerkKeys()) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Sign in before submitting proof." }, { status: 401 });

      const user = await User.findOne({ clerkId: userId });
      if (!user) return NextResponse.json({ error: "Creator account not found." }, { status: 404 });

      const creatorProfile = await CreatorProfile.findOne({ userId: user._id });
      const ownsCollaboration =
        idsMatch(collaboration.creatorUserId, user._id) ||
        idsMatch(collaboration.creatorProfileId, creatorProfile?._id) ||
        collaboration.creatorUsername === user.username;

      if (!ownsCollaboration) {
        return NextResponse.json({ error: "You can only submit proof for your own collaborations." }, { status: 403 });
      }
    }

    const now = new Date();
    const currentStatus = normalizeCollaborationStatus(collaboration.status);
    if (!["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED"].includes(currentStatus)) {
      return NextResponse.json({ error: "Proof can only be submitted after the collaboration is accepted and before approval." }, { status: 400 });
    }

    collaboration.set({
      status: "PROOF_SUBMITTED",
      deliveryProof: {
        ...plainProof(collaboration.deliveryProof),
        ...parsed.data,
        submittedAt: now,
        reviewedAt: null,
        reviewNote: "",
        issueNote: "",
        issueReportedAt: null,
        issueStatus: "dismissed",
        issueReviewedAt: now,
        issueReviewedByAdminId: "creator_resubmission",
      },
    });
    appendCollaborationTimeline(collaboration, {
      event: "PROOF_SUBMITTED",
      status: "PROOF_SUBMITTED",
      actor: "creator",
      note: parsed.data.notes,
      createdAt: now,
    });

    await collaboration.save();

    await notificationService.notifyProofSubmitted({ collaboration });

    return NextResponse.json({ ok: true, status: "PROOF_SUBMITTED" });
  } catch (error) {
    return handleRouteError(error, "Delivery proof submit failed", "Could not submit delivery proof.");
  }
}
