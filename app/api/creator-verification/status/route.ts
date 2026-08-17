import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { generateCreatorVerificationCode, hashCreatorVerificationCode, creatorVerificationExpiry, CREATOR_VERIFICATION_GENERATION_WINDOW_MS, CREATOR_VERIFICATION_MAX_GENERATIONS } from "@/lib/creator-verification";
import { hasMongoUri, modelForConnection, withMongoRequest } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { User } from "@/lib/models/User";
import { legacyPlatformAccounts } from "@/lib/creator-platforms";

async function context() {
  if (!hasClerkKeys()) return { response: NextResponse.json({ error: "Clerk is not configured yet." }, { status: 503 }) };
  const { userId } = await auth();
  if (!userId) return { response: NextResponse.json({ error: "Sign in before checking verification." }, { status: 401 }) };
  if (!hasMongoUri()) return { response: NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 }) };
  return { userId };
}

export async function GET() {
  try {
    const authContext = await context(); if ("response" in authContext) return authContext.response;
    return await withMongoRequest("creator-verification-status", async (connection) => {
      const ScopedUser = modelForConnection(connection, User), ScopedProfile = modelForConnection(connection, CreatorProfile), ScopedRequest = modelForConnection(connection, CreatorVerificationRequest);
      const user = await ScopedUser.findOne({ clerkId: authContext.userId, role: "creator" }).select("_id").lean();
      const profile = user ? await ScopedProfile.findOne({ userId: user._id }).select("platformAccounts youtubeUrl youtubeHandle instagramUrl podcastUrl claimedSubscribers subscribers instagramFollowers verificationStatus").lean() : null;
      if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
      const accounts = legacyPlatformAccounts(profile as unknown as Record<string, unknown>);
      const requests = await ScopedRequest.find({ creatorId: profile._id }).sort({ createdAt: -1 }).select("platformAccountId status codeExpiresAt submittedAt reviewedAt adminNote").lean();
      return NextResponse.json({ ok: true, isVerified: accounts.some((account) => account.verification.status === "verified"), accounts: accounts.map((account) => ({ id: account.id, platform: account.platform, profileUrl: account.profileUrl, customPlatformName: account.customPlatformName, verification: account.verification, request: requests.find((request) => request.platformAccountId === account.id) ?? null })) });
    });
  } catch (error) { return handleRouteError(error, "Creator verification status failed", "Could not load verification status."); }
}

const generateSchema = z.object({ platformAccountId: z.string().trim().min(1).max(80) });
export async function POST(req: Request) {
  try {
    const authContext = await context(); if ("response" in authContext) return authContext.response;
    const parsed = generateSchema.safeParse(await parseJsonBody(req)); if (!parsed.success) return NextResponse.json({ error: "Invalid platform account." }, { status: 400 });
    return await withMongoRequest("creator-verification-generate", async (connection) => {
      const ScopedUser = modelForConnection(connection, User), ScopedProfile = modelForConnection(connection, CreatorProfile), ScopedRequest = modelForConnection(connection, CreatorVerificationRequest);
      const user = await ScopedUser.findOne({ clerkId: authContext.userId, role: "creator" }).select("_id").lean();
      const profile = user ? await ScopedProfile.findOne({ userId: user._id }) : null;
      if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
      const account = legacyPlatformAccounts(profile.toObject() as unknown as Record<string, unknown>).find((item) => item.id === parsed.data.platformAccountId);
      if (!account) return NextResponse.json({ error: "Platform account not found." }, { status: 404 });
      if (account.verification.status === "verified") return NextResponse.json({ error: "This platform account is already verified." }, { status: 409 });
      const since = new Date(Date.now() - CREATOR_VERIFICATION_GENERATION_WINDOW_MS);
      if (await ScopedRequest.countDocuments({ creatorId: profile._id, generatedAt: { $gte: since } }) >= CREATOR_VERIFICATION_MAX_GENERATIONS) return NextResponse.json({ error: "Too many verification codes requested. Try again later." }, { status: 429, headers: { "Retry-After": "3600" } });
      await ScopedRequest.updateMany({ creatorId: profile._id, platformAccountId: account.id, status: { $in: ["generated", "pending"] } }, { $set: { status: "expired" } });
      const rawCode = generateCreatorVerificationCode(); const encoded = hashCreatorVerificationCode(rawCode); const now = new Date();
      const previous = await ScopedRequest.findOne({ creatorId: profile._id, platformAccountId: account.id }).sort({ generation: -1 }).select("generation").lean();
      await ScopedRequest.create({ creatorId: profile._id, platformAccountId: account.id, clerkUserId: authContext.userId, platform: account.platform, customPlatformName: account.customPlatformName ?? "", profileUrl: account.profileUrl, codeHash: encoded.hash, codeSalt: encoded.salt, codeExpiresAt: creatorVerificationExpiry(now), generatedAt: now, generation: (previous?.generation ?? 0) + 1, status: "generated" });
      return NextResponse.json({ ok: true, platformAccountId: account.id, verificationCode: rawCode, expiresAt: creatorVerificationExpiry(now).toISOString() }, { status: 201, headers: { "Cache-Control": "no-store" } });
    });
  } catch (error) { return handleRouteError(error, "Creator verification generation failed", "Could not generate a verification code."); }
}
