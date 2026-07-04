import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getAdminUsers } from "@/lib/queries/admin";
import { userAdminUpdateSchema } from "@/lib/validators/admin";

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const users = await getAdminUsers();
  return NextResponse.json({ users });
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
    const updated = await User.findByIdAndUpdate(
      parsed.data.userId,
      { $set: { accountStatus } },
      { new: true },
    );

    if (!updated) return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json({ ok: true, accountStatus });
  } catch (error) {
    return handleRouteError(error, "Admin user update failed", "Could not update user.");
  }
}
