import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function idsMatch(value: unknown, id: unknown) {
  return Boolean(value && id && value.toString() === id.toString());
}

export async function POST(_req: Request, { params }: RouteContext) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const { id } = await params;

    await connectDB();
    const collaboration = await BrandInquiry.findById(id);
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });

    if (hasClerkKeys()) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Sign in before updating work status." }, { status: 401 });

      const user = await User.findOne({ clerkId: userId });
      if (!user) return NextResponse.json({ error: "Creator account not found." }, { status: 404 });

      const creatorProfile = await CreatorProfile.findOne({ userId: user._id });
      const ownsCollaboration =
        idsMatch(collaboration.creatorUserId, user._id) ||
        idsMatch(collaboration.creatorProfileId, creatorProfile?._id) ||
        collaboration.creatorUsername === user.username;

      if (!ownsCollaboration) {
        return NextResponse.json({ error: "You can only update your own collaborations." }, { status: 403 });
      }
    }

    collaboration.set({ status: "work_started" });
    await collaboration.save();

    return NextResponse.json({ ok: true, status: "work_started" });
  } catch (error) {
    return handleRouteError(error, "Work status update failed", "Could not update work status.");
  }
}
