import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { SavedCreator } from "@/lib/models/SavedCreator";
import { User } from "@/lib/models/User";

const schema = z.object({ username: z.string().trim().toLowerCase().min(1).max(40) });

async function brandUser() {
  if (!hasClerkKeys()) return null;
  const { userId } = await auth();
  if (!userId) return null;
  return User.findOne({ clerkId: userId, role: "brand", onboardingComplete: true }).select("_id").exec();
}

export async function POST(req: Request) {
  try {
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
    const parsed = schema.safeParse(await parseJsonBody(req));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    await connectDB();
    const brand = await brandUser();
    if (!brand) return NextResponse.json({ error: "A brand account is required." }, { status: 403 });
    const creator = await User.findOne({ username: parsed.data.username, role: "creator", onboardingComplete: true, accountStatus: "active" }).select("_id");
    if (!creator) return NextResponse.json({ error: "Creator not found." }, { status: 404 });
    await SavedCreator.updateOne(
      { brandUserId: brand._id, creatorUserId: creator._id },
      { $setOnInsert: { brandUserId: brand._id, creatorUserId: creator._id } },
      { upsert: true },
    );
    return NextResponse.json({ ok: true, saved: true });
  } catch (error) {
    return handleRouteError(error, "Save creator failed", "Could not save creator.");
  }
}

export async function DELETE(req: Request) {
  try {
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
    const parsed = schema.safeParse(await parseJsonBody(req));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    await connectDB();
    const brand = await brandUser();
    if (!brand) return NextResponse.json({ error: "A brand account is required." }, { status: 403 });
    const creator = await User.findOne({ username: parsed.data.username, role: "creator" }).select("_id");
    if (creator) await SavedCreator.deleteOne({ brandUserId: brand._id, creatorUserId: creator._id });
    return NextResponse.json({ ok: true, saved: false });
  } catch (error) {
    return handleRouteError(error, "Remove saved creator failed", "Could not remove saved creator.");
  }
}
