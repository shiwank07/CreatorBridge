import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { getAdminBrands } from "@/lib/queries/admin";
import { brandAdminUpdateSchema } from "@/lib/validators/admin";

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const brands = await getAdminBrands();
  return NextResponse.json({ brands });
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = brandAdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid brand update." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ username: parsed.data.username, role: "brand" });
    if (!user) return NextResponse.json({ error: "Brand not found." }, { status: 404 });

    const accountStatusPatch =
      parsed.data.action === "hide"
        ? { accountStatus: "hidden" }
        : parsed.data.action === "suspend"
          ? { accountStatus: "suspended" }
          : parsed.data.action === "restore"
            ? { accountStatus: "active" }
            : null;

    if (accountStatusPatch) {
      await User.updateOne({ _id: user._id }, { $set: accountStatusPatch });
      return NextResponse.json({ ok: true });
    }

    const profile = await BrandProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Brand profile not found." }, { status: 404 });

    const isApproved = parsed.data.action === "approve";
    const now = new Date();

    await BrandProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          verificationStatus: isApproved ? "verified" : "rejected",
          verificationReviewedAt: now,
          verificationReviewedByAdminId: admin.userId ?? "",
          verificationNote: parsed.data.note,
          rejectionReason: isApproved ? "" : parsed.data.note,
        },
      },
    );
    await User.updateOne({ _id: user._id }, { $set: { isVerified: isApproved } });

    if (isApproved) {
      await notificationService.notifyVerificationApproved({
        user,
        accountType: "brand",
        note: parsed.data.note,
        statusLabel: "Brand verified",
      });
    } else {
      await notificationService.notifyVerificationRejected({ user, accountType: "brand", note: parsed.data.note });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin brand update failed", "Could not update brand.");
  }
}
