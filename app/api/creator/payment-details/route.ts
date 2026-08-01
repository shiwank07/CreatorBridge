import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { creatorPaymentDetailsSchema } from "@/lib/validators/payment-details";

async function owner() {
  const { userId } = await auth();
  if (!userId) return null;
  await connectDB();
  const user = await User.findOne({ clerkId: userId, role: "creator" }).select("_id").lean();
  return user?._id ?? null;
}

export async function GET() {
  if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
  const userId = await owner();
  if (!userId) return NextResponse.json({ error: "Creator authentication required." }, { status: 401 });
  const profile = await CreatorProfile.findOne({ userId }).select("+paymentDetails.upiId +paymentDetails.accountNumber paymentDetails").lean();
  return NextResponse.json({ paymentDetails: profile?.paymentDetails ?? null }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
  const userId = await owner();
  if (!userId) return NextResponse.json({ error: "Creator authentication required." }, { status: 401 });
  const parsed = creatorPaymentDetailsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payment details." }, { status: 400 });
  const paymentDetails = { ...parsed.data, updatedAt: new Date() };
  await CreatorProfile.updateOne({ userId }, { $set: { paymentDetails } });
  return NextResponse.json({ ok: true, updatedAt: paymentDetails.updatedAt }, { headers: { "Cache-Control": "no-store" } });
}
