import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { getClerkPhoneVerificationState } from "@/lib/clerk-verification";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { normalizePhoneNumber } from "@/lib/phone";

const phoneVerificationSyncSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .transform((value) => normalizePhoneNumber(value))
    .refine((value) => /^\+\d{7,15}$/.test(value), "Enter your phone number in international format, for example +91 98765 43210."),
  clerkPhoneNumberId: z.string().trim().optional().default(""),
});

export async function POST(req: Request) {
  try {
    if (!hasClerkKeys()) {
      return NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before verifying a phone number." }, { status: 401 });
    }

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = phoneVerificationSyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid phone number." }, { status: 400 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.id !== userId) {
      return NextResponse.json({ error: "Could not confirm the signed-in Clerk user." }, { status: 401 });
    }

    const phoneState = getClerkPhoneVerificationState(
      clerkUser,
      parsed.data.clerkPhoneNumberId,
      parsed.data.phoneNumber,
    );

    if (!phoneState?.verified) {
      return NextResponse.json({ error: "Verify this phone number with Clerk before saving it to Branzzo." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "Complete onboarding before verifying a phone number." }, { status: 404 });
    }

    const phoneNumber = phoneState.phoneNumber;
    const phoneVerifiedAt = new Date();
    const phoneUpdate = {
      phoneNumber,
      phoneVerified: true,
      phoneVerifiedAt,
    };

    await User.updateOne({ _id: user._id }, { $set: phoneUpdate });

    const profileUpdate = { $set: phoneUpdate };
    if (user.role === "creator") {
      await CreatorProfile.updateOne({ userId: user._id }, profileUpdate);
    }

    if (user.role === "brand") {
      await BrandProfile.updateOne({ userId: user._id }, profileUpdate);
    }

    return NextResponse.json({
      ok: true,
      phoneNumber,
      phoneVerified: true,
      phoneVerifiedAt: phoneVerifiedAt.toISOString(),
    });
  } catch (error) {
    return handleRouteError(error, "Phone verification sync failed", "Could not verify your phone number.");
  }
}
