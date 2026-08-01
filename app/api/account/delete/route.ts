import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { anonymizeDeletedAccount } from "@/lib/account-deletion";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";

export async function POST(req: Request) {
  try {
    if (!hasClerkKeys()) return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });

    const body = await parseJsonBody(req);
    if (body.confirmation !== "DELETE") {
      return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in before deleting your account." }, { status: 401 });

    await connectDB();
    const deletedAt = new Date();
    await anonymizeDeletedAccount({
      clerkUserId: userId, deletedAt, eventId: `self-service:${userId}:${deletedAt.getTime()}`,
      eventTimestamp: deletedAt, source: "self_service",
    });

    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Account deletion failed", "Could not delete this account.");
  }
}
