import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { getPendingCreatorVerifications } from "@/lib/queries/admin";
import { creatorVerificationUpdateSchema } from "@/lib/validators/admin";

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const creators = await getPendingCreatorVerifications();
  return NextResponse.json({ creators });
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = creatorVerificationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid verification update." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ username: parsed.data.username });
    if (!user) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

    const profile = await CreatorProfile.findOne({ userId: user._id });
    if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });

    const now = new Date();
    const claimedSubscribers = profile.claimedSubscribers ?? profile.subscribers ?? 0;
    const verificationNote = parsed.data.note;
    const update: Record<string, unknown> = {
      verificationNote,
      lastVerifiedAt: now,
    };

    if (parsed.data.action === "approve_ownership") {
      update.verificationStatus = "ownership_verified";
    }

    if (parsed.data.action === "approve_stats") {
      update.verificationStatus = "stats_verified";
      update.verifiedSubscribers = parsed.data.verifiedSubscribers ?? claimedSubscribers;
    }

    if (parsed.data.action === "reject") {
      update.verificationStatus = "rejected";
    }

    await CreatorProfile.updateOne({ _id: profile._id }, { $set: update });

    if (parsed.data.action === "approve_stats" || parsed.data.action === "reject") {
      await User.updateOne({ _id: user._id }, { $set: { isVerified: parsed.data.action === "approve_stats" } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin verification update failed", "Could not update verification.");
  }
}
