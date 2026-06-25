import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { brandInquirySchema } from "@/lib/validators/brand-inquiry";

export async function POST(req: Request) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = brandInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid campaign inquiry." }, { status: 400 });
    }

    await connectDB();
    const inquiry = await BrandInquiry.create(parsed.data);

    return NextResponse.json({ ok: true, id: inquiry._id.toString() }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Brand inquiry failed", "Could not submit the inquiry.");
  }
}
