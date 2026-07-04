import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { getAdminCreators } from "@/lib/queries/admin";
import { creatorAdminUpdateSchema } from "@/lib/validators/admin";

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const creators = await getAdminCreators();
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
    const parsed = creatorAdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid creator update." }, { status: 400 });
    }

    await connectDB();
    const updated = await User.findOneAndUpdate(
      { username: parsed.data.username, role: "creator" },
      {
        $set: {
          ...(typeof parsed.data.isFeatured === "boolean" ? { isFeatured: parsed.data.isFeatured } : {}),
          ...(typeof parsed.data.isVerified === "boolean" ? { isVerified: parsed.data.isVerified } : {}),
          ...(parsed.data.action === "hide_profile" ? { accountStatus: "hidden" } : {}),
          ...(parsed.data.action === "suspend" ? { accountStatus: "suspended" } : {}),
          ...(parsed.data.action === "restore" ? { accountStatus: "active" } : {}),
        },
      },
      { new: true },
    );

    if (!updated) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

    if (typeof parsed.data.isVerified === "boolean" || parsed.data.action === "approve_verification" || parsed.data.action === "reject_verification") {
      const profile = await CreatorProfile.findOne({ userId: updated._id });
      if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
      const claimedSubscribers = profile?.claimedSubscribers ?? profile?.subscribers ?? 0;
      const isApproved = parsed.data.action === "approve_verification" || parsed.data.isVerified === true;
      const isRejected = parsed.data.action === "reject_verification";
      const now = new Date();

      await CreatorProfile.updateOne(
        { userId: updated._id },
        {
          $set: {
            verificationStatus: isRejected ? "rejected" : isApproved ? "verified" : "unverified",
            verifiedSubscribers: isApproved ? claimedSubscribers : 0,
            verificationReviewedAt: now,
            verificationReviewedByAdminId: admin.userId ?? "",
            verificationNote: parsed.data.note,
            verificationRejectedReason: isRejected ? parsed.data.note : "",
            lastVerifiedAt: isApproved ? now : null,
          },
        },
      );

      await User.updateOne({ _id: updated._id }, { $set: { isVerified: isApproved } });

      if (parsed.data.action === "approve_verification") {
        await notificationService.notifyVerificationApproved({
          user: updated,
          accountType: "creator",
          note: parsed.data.note,
          statusLabel: "Verified Creator",
        });
      }

      if (isRejected) {
        await notificationService.notifyVerificationRejected({ user: updated, accountType: "creator", note: parsed.data.note });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin creator update failed", "Could not update creator.");
  }
}
