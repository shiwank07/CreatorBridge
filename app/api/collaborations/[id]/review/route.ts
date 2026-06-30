import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
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
        status: "approved",
      });
    }

    if (parsed.data.action === "request_changes") {
      collaboration.set({
        ...update,
        status: "changes_requested",
      });
    }

    if (parsed.data.action === "report_issue") {
      collaboration.set({
        status: "changes_requested",
        deliveryProof: {
          ...currentProof,
          reviewedAt: now,
          reviewNote: parsed.data.note,
          issueNote: parsed.data.note,
          issueReportedAt: now,
        },
      });
    }

    if (parsed.data.action === "mark_completed") {
      collaboration.set({
        ...update,
        status: "completed",
      });
    }

    await collaboration.save();

    if (parsed.data.action === "approve_delivery") {
      await notificationService.notifyDeliveryApproved({ collaboration, note: parsed.data.note });
    }

    if (parsed.data.action === "request_changes" || parsed.data.action === "report_issue") {
      await notificationService.notifyDeliveryChangesRequested({ collaboration, note: parsed.data.note });
    }

    return NextResponse.json({ ok: true, status: collaboration.status });
  } catch (error) {
    return handleRouteError(error, "Delivery review failed", "Could not review delivery proof.");
  }
}
