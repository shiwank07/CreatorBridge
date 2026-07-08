import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { canRevealCollaborationContactEmail, normalizeCollaborationStatus } from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { collaborationPaymentSchema } from "@/lib/validators/brand-inquiry";

function idsMatch(value: unknown, id: unknown) {
  return Boolean(value && id && value.toString() === id.toString());
}

async function ownsAsBrand(collaboration: Awaited<ReturnType<typeof BrandInquiry.findById>>, user: Awaited<ReturnType<typeof User.findOne>>) {
  if (!collaboration || !user) return false;
  const brandProfile = await BrandProfile.findOne({ userId: user._id }).select("_id contactEmail").exec();
  return (
    collaboration.createdByClerkId === user.clerkId ||
    idsMatch(collaboration.brandUserId, user._id) ||
    idsMatch(collaboration.brandProfileId, brandProfile?._id) ||
    (brandProfile?.contactEmail ? collaboration.email === brandProfile.contactEmail : false)
  );
}

async function ownsAsCreator(collaboration: Awaited<ReturnType<typeof BrandInquiry.findById>>, user: Awaited<ReturnType<typeof User.findOne>>) {
  if (!collaboration || !user) return false;
  const creatorProfile = await CreatorProfile.findOne({ userId: user._id }).select("_id").exec();
  return (
    idsMatch(collaboration.creatorUserId, user._id) ||
    idsMatch(collaboration.creatorProfileId, creatorProfile?._id) ||
    collaboration.creatorUsername === user.username
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    if (!hasClerkKeys()) return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });

    const body = await parseJsonBody(req);
    const parsed = collaborationPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payment update." }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in before updating payment status." }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const [user, collaboration] = await Promise.all([
      User.findOne({ clerkId: userId }).exec(),
      BrandInquiry.findById(id).exec(),
    ]);

    if (!user || (user.role !== "brand" && user.role !== "creator")) {
      return NextResponse.json({ error: "Only brand and creator accounts can update payment status." }, { status: 403 });
    }
    if (!collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });

    const currentStatus = normalizeCollaborationStatus(collaboration.status);
    if (!canRevealCollaborationContactEmail(currentStatus)) {
      return NextResponse.json({ error: "Payment updates are available only after the creator accepts." }, { status: 400 });
    }

    const isBrandOwner = user.role === "brand" && (await ownsAsBrand(collaboration, user));
    const isCreatorOwner = user.role === "creator" && (await ownsAsCreator(collaboration, user));
    if (!isBrandOwner && !isCreatorOwner) {
      return NextResponse.json({ error: "You can only update payments for your own collaborations." }, { status: 403 });
    }

    if (parsed.data.action === "mark_payment_sent" && !isBrandOwner) {
      return NextResponse.json({ error: "Only the brand can mark payment sent." }, { status: 403 });
    }

    if (parsed.data.action === "mark_payment_received" && !isCreatorOwner) {
      return NextResponse.json({ error: "Only the creator can mark payment received." }, { status: 403 });
    }

    const paymentStatus =
      parsed.data.action === "mark_payment_sent"
        ? "payment_sent"
        : parsed.data.action === "mark_payment_received"
          ? "payment_received"
          : "payment_disputed";

    collaboration.set({
      paymentStatus,
      paymentNote: parsed.data.paymentNote,
      paymentScreenshotUrl: parsed.data.paymentScreenshotUrl,
      paymentUpdatedAt: new Date(),
      paymentUpdatedBy: user.role,
    });
    await collaboration.save();

    return NextResponse.json({ ok: true, paymentStatus });
  } catch (error) {
    return handleRouteError(error, "Payment update failed", "Could not update payment status.");
  }
}
