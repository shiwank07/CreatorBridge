import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { getPendingCreatorVerifications } from "@/lib/queries/admin";
import { creatorVerificationUpdateSchema } from "@/lib/validators/admin";
import { isVerificationCode } from "@/lib/verification-code";

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const creators = await getPendingCreatorVerifications();
  return NextResponse.json({ creators });
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = creatorVerificationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid verification update." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ username: parsed.data.username });
    if (!user) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

    const profile = await CreatorProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });

    if ((parsed.data.action === "approve" || parsed.data.action === "approve_ownership") && !isVerificationCode(profile.verificationCode)) {
      return NextResponse.json({ error: "The creator does not have a valid stored BZ or legacy CB verification code." }, { status: 400 });
    }

    const now = new Date();
    const claimedSubscribers = profile.claimedSubscribers ?? profile.subscribers ?? 0;
    const claimedAverageViews = profile.claimedAverageViews ?? profile.avgViews ?? 0;
    const claimedEngagementRate = profile.claimedEngagementRate ?? 0;
    const verificationNote = parsed.data.note;
    const update: Record<string, unknown> = {
      verificationNote,
      verificationReviewedAt: now,
      verificationReviewedByAdminId: admin.userId ?? "",
      verificationRejectedReason: "",
    };

    if (parsed.data.action === "approve" || parsed.data.action === "approve_ownership" || parsed.data.action === "approve_stats") {
      update.verificationStatus = "verified";
      update.verifiedSubscribers = parsed.data.verifiedSubscribers ?? claimedSubscribers;
      update.verifiedAverageViews = parsed.data.verifiedAverageViews ?? claimedAverageViews;
      update.verifiedEngagementRate = parsed.data.verifiedEngagementRate ?? claimedEngagementRate;
      update.statsVerificationStatus = "verified";
      update.verifiedAt = now;
      update.lastVerifiedAt = now;
    }

    if (parsed.data.action === "reject") {
      update.verificationStatus = "rejected";
      update.statsVerificationStatus = "rejected";
      update.verificationRejectedReason = verificationNote;
    }

    await CreatorProfile.updateOne({ _id: profile._id }, { $set: update });

    const isApproved = parsed.data.action === "approve" || parsed.data.action === "approve_ownership" || parsed.data.action === "approve_stats";
    await User.updateOne({ _id: user._id }, { $set: { isVerified: isApproved } });

    if (parsed.data.action === "reject") {
      await notificationService.notifyVerificationRejected({ user, accountType: "creator", note: verificationNote });
    } else {
      await notificationService.notifyVerificationApproved({
        user,
        accountType: "creator",
        note: verificationNote,
        statusLabel: "Verified Creator",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin verification update failed", "Could not update verification.");
  }
}
