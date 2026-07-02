import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { getAdminCreators } from "@/lib/queries/admin";
import { creatorAdminUpdateSchema } from "@/lib/validators/admin";

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const creators = await getAdminCreators();
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
    const parsed = creatorAdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid creator update." }, { status: 400 });
    }

    await connectDB();
    const updated = await User.findOneAndUpdate(
      { username: parsed.data.username },
      {
        $set: {
          ...(typeof parsed.data.isFeatured === "boolean" ? { isFeatured: parsed.data.isFeatured } : {}),
          ...(typeof parsed.data.isVerified === "boolean" ? { isVerified: parsed.data.isVerified } : {}),
        },
      },
      { new: true },
    );

    if (!updated) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

    if (typeof parsed.data.isVerified === "boolean") {
      const profile = await CreatorProfile.findOne({ userId: updated._id });
      const claimedSubscribers = profile?.claimedSubscribers ?? profile?.subscribers ?? 0;

      await CreatorProfile.updateOne(
        { userId: updated._id },
        {
          $set: {
            verificationStatus: parsed.data.isVerified ? "verified" : "unverified",
            verifiedSubscribers: parsed.data.isVerified ? claimedSubscribers : 0,
            lastVerifiedAt: parsed.data.isVerified ? new Date() : null,
          },
        },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Admin creator update failed", "Could not update creator.");
  }
}
