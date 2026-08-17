import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getAdminCreatorsPage } from "@/lib/queries/admin";
import { creatorAdminUpdateSchema } from "@/lib/validators/admin";

export async function GET(req: Request) {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const url = new URL(req.url);
  return NextResponse.json(await getAdminCreatorsPage({
    page: Number(url.searchParams.get("page") ?? 1),
    limit: Number(url.searchParams.get("limit") ?? 30),
    verification: url.searchParams.get("verification") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    platform: url.searchParams.get("platform") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
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
    const parsed = creatorAdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid creator update." }, { status: 400 });
    }
    if (typeof parsed.data.isVerified === "boolean" || parsed.data.action === "approve_verification" || parsed.data.action === "reject_verification") return NextResponse.json({ error: "Review an exact platform account in the verification queue." }, { status: 400 });

    await connectDB();
    const updated = await User.findOneAndUpdate(
      { username: parsed.data.username, role: "creator", accountStatus: { $ne: "deleted" } },
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

    if (!updated) {
      const exists = await User.exists({ username: parsed.data.username, role: "creator" });
      return NextResponse.json(
        { error: exists ? "Deleted accounts cannot be changed." : "Creator not found." },
        { status: exists ? 409 : 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin creator update failed", "Could not update creator.");
  }
}
