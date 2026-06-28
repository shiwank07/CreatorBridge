import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
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
    const clerkId = hasClerkKeys() ? (await auth()).userId ?? "" : "";
    const brandUser = clerkId ? await User.findOne({ clerkId }) : null;
    const brandProfile = brandUser ? await BrandProfile.findOne({ userId: brandUser._id }) : null;
    const creatorUser = parsed.data.creatorUsername
      ? await User.findOne({ username: parsed.data.creatorUsername, role: "creator" })
      : null;
    const creatorProfile = creatorUser ? await CreatorProfile.findOne({ userId: creatorUser._id }) : null;

    const inquiryPayload: Record<string, unknown> = {
      ...parsed.data,
      createdByClerkId: clerkId,
      source: parsed.data.creatorUsername ? "creator_profile" : "general_form",
    };

    if (brandUser) inquiryPayload.brandUserId = brandUser._id;
    if (brandProfile) inquiryPayload.brandProfileId = brandProfile._id;
    if (creatorUser) inquiryPayload.creatorUserId = creatorUser._id;
    if (creatorProfile) inquiryPayload.creatorProfileId = creatorProfile._id;

    const inquiry = await BrandInquiry.create(inquiryPayload);

    return NextResponse.json({ ok: true, id: inquiry._id.toString() }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Brand inquiry failed", "Could not submit the inquiry.");
  }
}
