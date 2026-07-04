import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { appendCollaborationTimeline, normalizeCollaborationStatus } from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { deliveryReviewSchema } from "@/lib/validators/brand-inquiry";

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
    const parsed = deliveryReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid delivery review." }, { status: 400 });
    }

    await connectDB();
    const collaboration = await BrandInquiry.findById(id);
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });

    if (hasClerkKeys()) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Sign in before reviewing proof." }, { status: 401 });

      const user = await User.findOne({ clerkId: userId });
      if (!user) return NextResponse.json({ error: "Brand account not found." }, { status: 404 });

      const brandProfile = await BrandProfile.findOne({ userId: user._id });
      const ownsCollaboration =
        collaboration.createdByClerkId === user.clerkId ||
        idsMatch(collaboration.brandUserId, user._id) ||
        idsMatch(collaboration.brandProfileId, brandProfile?._id) ||
        (brandProfile?.contactEmail ? collaboration.email === brandProfile.contactEmail : false);

      if (!ownsCollaboration) {
        return NextResponse.json({ error: "You can only review proof for your own collaborations." }, { status: 403 });
      }
    }

    if (!collaboration.deliveryProof?.videoUrl) {
      return NextResponse.json({ error: "No delivery proof has been submitted yet." }, { status: 400 });
    }

    const now = new Date();
    const currentStatus = normalizeCollaborationStatus(collaboration.status);
    if (!["PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED"].includes(currentStatus)) {
      return NextResponse.json({ error: "This collaboration is not ready for brand review." }, { status: 400 });
    }

    const currentProof = plainProof(collaboration.deliveryProof);
    const update = {
      deliveryProof: {
        ...currentProof,
        reviewedAt: now,
        reviewNote: parsed.data.note,
        issueNote: currentProof.issueNote ?? "",
        issueReportedAt: currentProof.issueReportedAt ?? null,
      },
    };

    if (parsed.data.action === "approve_delivery") {
      collaboration.set({
        ...update,
        status: "APPROVED",
      });
      appendCollaborationTimeline(collaboration, {
        event: "APPROVED",
        status: "APPROVED",
        actor: "brand",
        note: parsed.data.note || "Brand approved the delivery proof.",
        createdAt: now,
      });
    }

    if (parsed.data.action === "request_changes") {
      collaboration.set({
        ...update,
        status: "REVISION_REQUESTED",
      });
      appendCollaborationTimeline(collaboration, {
        event: "REVISION_REQUESTED",
        status: "REVISION_REQUESTED",
        actor: "brand",
        note: parsed.data.note,
        createdAt: now,
      });
    }

    if (parsed.data.action === "report_issue") {
      collaboration.set({
        status: "REVISION_REQUESTED",
        deliveryProof: {
          ...currentProof,
          reviewedAt: now,
          reviewNote: parsed.data.note,
          issueNote: parsed.data.note,
          issueReportedAt: now,
          issueStatus: "open",
          issueReviewedAt: null,
          issueReviewedByAdminId: "",
        },
      });
      appendCollaborationTimeline(collaboration, {
        event: "REVISION_REQUESTED",
        status: "REVISION_REQUESTED",
        actor: "brand",
        note: parsed.data.note,
        createdAt: now,
      });
    }

    if (parsed.data.action === "mark_completed") {
      collaboration.set({
        ...update,
        status: "COMPLETED",
      });
      appendCollaborationTimeline(collaboration, {
        event: "COMPLETED",
        status: "COMPLETED",
        actor: "brand",
        note: parsed.data.note || "Brand closed the collaboration as completed.",
        createdAt: now,
      });
    }

    await collaboration.save();

    if (parsed.data.action === "mark_completed") {
      await Promise.all([
        collaboration.creatorProfileId
          ? CreatorProfile.updateOne(
              { _id: collaboration.creatorProfileId },
              { $inc: { completedCampaigns: 1, totalDeals: 1 } },
            )
          : Promise.resolve(),
        collaboration.brandProfileId
          ? BrandProfile.updateOne(
              { _id: collaboration.brandProfileId },
              { $inc: { completedCampaigns: 1 } },
            )
          : Promise.resolve(),
      ]);
    }

    if (parsed.data.action === "approve_delivery") {
      await notificationService.notifyDeliveryApproved({ collaboration, note: parsed.data.note });
    }

    if (parsed.data.action === "request_changes" || parsed.data.action === "report_issue") {
      await notificationService.notifyDeliveryChangesRequested({ collaboration, note: parsed.data.note });
    }

    if (parsed.data.action === "mark_completed") {
      await notificationService.notifyCollaborationCompleted({ collaboration, note: parsed.data.note });
    }

    return NextResponse.json({ ok: true, status: collaboration.status });
  } catch (error) {
    return handleRouteError(error, "Delivery review failed", "Could not review delivery proof.");
  }
}
