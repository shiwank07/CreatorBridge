import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { getAdminContactsPage } from "@/lib/queries/admin";
import { adminContactUpdateSchema } from "@/lib/validators/admin";

export async function GET(req: Request) {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const url = new URL(req.url);
  return NextResponse.json(await getAdminContactsPage({
    page: Number(url.searchParams.get("page") ?? 1),
    limit: Number(url.searchParams.get("limit") ?? 30),
    role: url.searchParams.get("role") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  }));
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = adminContactUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid contact update." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(parsed.data.userId);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const phoneVerifiedAt = parsed.data.phoneVerified ? new Date() : null;

    await User.updateOne({ _id: user._id }, { $set: { phoneVerified: parsed.data.phoneVerified, phoneVerifiedAt } });

    const profileUpdate = {
      $set: {
        phoneNumber: user.phoneNumber ?? "",
        phoneVerified: parsed.data.phoneVerified,
        phoneVerifiedAt,
      },
    };

    if (user.role === "creator") {
      await CreatorProfile.updateOne({ userId: user._id }, profileUpdate);
    }

    if (user.role === "brand") {
      await BrandProfile.updateOne({ userId: user._id }, profileUpdate);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin contact update failed", "Could not update contact details.");
  }
}
