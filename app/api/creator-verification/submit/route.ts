import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { isCreatorVerificationExpired } from "@/lib/creator-verification";
import { legacyPlatformAccounts } from "@/lib/creator-platforms";

const schema = z.object({ platformAccountId: z.string().trim().min(1).max(80), note: z.string().trim().max(500).default("") });
export async function POST(req: Request) {
  try {
    if (!hasClerkKeys()) return NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 });
    const { userId } = await auth(); if (!userId) return NextResponse.json({ error: "Sign in before submitting verification." }, { status: 401 });
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    const parsed = schema.safeParse(await parseJsonBody(req)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid verification request." }, { status: 400 });
    await connectDB();
    const user = await User.findOne({ clerkId: userId, role: "creator" }); const profile = user ? await CreatorProfile.findOne({ userId: user._id }) : null;
    if (!user || !profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    const account = legacyPlatformAccounts(profile.toObject() as unknown as Record<string, unknown>).find((item) => item.id === parsed.data.platformAccountId);
    if (!account) return NextResponse.json({ error: "Platform account not found." }, { status: 404 });
    if (account.verification.status === "verified") return NextResponse.json({ error: "This platform account is already verified." }, { status: 409 });
    const verificationRequest = await CreatorVerificationRequest.findOne({ creatorId: profile._id, platformAccountId: account.id, clerkUserId: userId, status: "generated" }).sort({ generation: -1 });
    if (!verificationRequest) return NextResponse.json({ error: "Generate a verification code for this account first." }, { status: 409 });
    if (isCreatorVerificationExpired(verificationRequest.codeExpiresAt)) { verificationRequest.status = "expired"; await verificationRequest.save(); return NextResponse.json({ error: "The verification code expired. Generate a new code." }, { status: 410 }); }
    verificationRequest.status = "pending"; verificationRequest.creatorNote = parsed.data.note; verificationRequest.submittedAt = new Date(); await verificationRequest.save();
    const accounts = legacyPlatformAccounts(profile.toObject() as unknown as Record<string, unknown>).map((item) => item.id === account.id ? { ...item, verification: { status: "pending" as const, method: "bio_code" as const } } : item);
    await CreatorProfile.updateOne({ _id: profile._id }, { $set: { platformAccounts: accounts } });
    await notificationService.notifyVerificationSubmitted({ user, platform: account.platform === "other" ? account.customPlatformName || "Other" : account.platform, profileUrl: account.profileUrl });
    return NextResponse.json({ ok: true, requestId: verificationRequest._id.toString(), status: "pending" }, { status: 201 });
  } catch (error) { return handleRouteError(error, "Creator verification submission failed", "Could not submit verification."); }
}
