import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { getAdminInquiries } from "@/lib/queries/admin";
import { inquiryStatusSchema } from "@/lib/validators/brand-inquiry";

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
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid inquiry update." }, { status: 400 });
    }

    await connectDB();
    const updated = await BrandInquiry.findByIdAndUpdate(parsed.data.id, { $set: { status: parsed.data.status } }, { new: true });
    if (!updated) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin inquiry update failed", "Could not update inquiry.");
  }
}
