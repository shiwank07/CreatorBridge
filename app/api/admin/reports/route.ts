import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { User } from "@/lib/models/User";
import { getAdminReports } from "@/lib/queries/admin";
import { reportAdminUpdateSchema } from "@/lib/validators/admin";

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const reports = await getAdminReports();
  return NextResponse.json({ reports });
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = reportAdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid report update." }, { status: 400 });
    }

    await connectDB();
    const report = await BrandInquiry.findById(parsed.data.id);
    if (!report?.deliveryProof?.issueReportedAt) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const status = parsed.data.action === "dismiss" ? "dismissed" : "resolved";
    report.set({
      "deliveryProof.issueStatus": status,
      "deliveryProof.issueReviewedAt": new Date(),
      "deliveryProof.issueReviewedByAdminId": admin.userId ?? "",
    });
    await report.save();

    if (parsed.data.action === "suspend_user" && report.creatorUsername) {
      await User.updateOne(
        { username: report.creatorUsername, role: "creator" },
        { $set: { accountStatus: "suspended" } },
      );
    }

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return handleRouteError(error, "Admin report update failed", "Could not update report.");
  }
}
