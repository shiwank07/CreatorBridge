import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getAdminUsersPage } from "@/lib/queries/admin";
import { userAdminUpdateSchema } from "@/lib/validators/admin";

export async function GET(req: Request) {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const url = new URL(req.url);
  return NextResponse.json(await getAdminUsersPage({
    page: Number(url.searchParams.get("page") ?? 1),
    limit: Number(url.searchParams.get("limit") ?? 30),
    role: url.searchParams.get("role") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    onboarding: url.searchParams.get("onboarding") ?? undefined,
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
    const parsed = userAdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid user update." }, { status: 400 });
    }

    const accountStatus = parsed.data.action === "restore" ? "active" : parsed.data.action === "hide" ? "hidden" : "suspended";

    await connectDB();
    const updated = await User.findOneAndUpdate(
      { _id: parsed.data.userId, accountStatus: { $ne: "deleted" } },
      { $set: { accountStatus } },
      { new: true },
    );

    if (!updated) {
      const exists = await User.exists({ _id: parsed.data.userId });
      return NextResponse.json(
        { error: exists ? "Deleted accounts cannot be changed." : "User not found." },
        { status: exists ? 409 : 404 },
      );
    }

    return NextResponse.json({ ok: true, accountStatus });
  } catch (error) {
    return handleRouteError(error, "Admin user update failed", "Could not update user.");
  }
}
