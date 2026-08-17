import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminState } from "@/lib/admin";
import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { connectDB, hasMongoUri } from "@/lib/db";
import { Counter } from "@/lib/models/Counter";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { FoundingCreatorIssuance } from "@/lib/models/FoundingCreatorIssuance";
import { User } from "@/lib/models/User";
import { legacyPlatformAccounts } from "@/lib/creator-platforms";
import { allocateFoundingCreatorIssuance } from "@/lib/founding-creators";

const schema = z.object({ username: z.string().trim().toLowerCase().min(3).max(40), action: z.enum(["grant", "revoke", "restore"]), reason: z.string().trim().max(500).default("") }).refine((v) => v.action === "grant" || v.reason.length >= 2, { path: ["reason"], message: "A reason is required." });
export async function GET(req: Request) {
  const admin = await getAdminState(); if (!admin.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
  await connectDB(); const username = new URL(req.url).searchParams.get("username")?.trim().toLowerCase();
  const user = username ? await User.findOne({ username, role: "creator" }).select("_id").lean() : null; const profile = user ? await CreatorProfile.findOne({ userId: user._id }).select("_id").lean() : null;
  const issuance = profile ? await FoundingCreatorIssuance.findOne({ creatorId: profile._id }).select("number status grantedAt revokedAt revocationReason audit.action audit.at audit.reason").lean() : null;
  const counter = await Counter.findOne({ key: "founding_creator" }).select("value").lean();
  return NextResponse.json({ nextNumber: Math.min((counter?.value ?? 0) + 1, 101), exhausted: (counter?.value ?? 0) >= 100, issuance: issuance ? { number: issuance.number, status: issuance.status, grantedAt: issuance.grantedAt, revokedAt: issuance.revokedAt, revocationReason: issuance.revocationReason, history: issuance.audit.map((entry) => ({ action: entry.action, at: entry.at, reason: entry.reason })) } : null });
}
export async function POST(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
    const parsed = schema.safeParse(await parseJsonBody(req));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    await connectDB();
    const user = await User.findOne({ username: parsed.data.username, role: "creator" }).select("_id").lean();
    const profile = user ? await CreatorProfile.findOne({ userId: user._id }) : null;
    if (!profile) return NextResponse.json({ error: "Creator not found." }, { status: 404 });
    const existing = await FoundingCreatorIssuance.findOne({ creatorId: profile._id });
    const now = new Date();
    if (parsed.data.action === "grant") {
      if (existing) { await CreatorProfile.updateOne({ _id: profile._id }, { $set: { foundingCreator: { number: existing.number, status: existing.status, grantedAt: existing.grantedAt, grantedBy: existing.grantedBy, revokedAt: existing.revokedAt, revokedBy: existing.revokedBy, revocationReason: existing.revocationReason } } }); return NextResponse.json({ ok: true, number: existing.number, status: existing.status }); }
      if (!legacyPlatformAccounts(profile.toObject() as unknown as Record<string, unknown>).some((account) => account.verification.status === "verified")) return NextResponse.json({ error: "A verified platform account is required." }, { status: 409 });
      const allocation = await allocateFoundingCreatorIssuance(profile._id, admin.userId, now);
      if (!allocation.issuance) return NextResponse.json({ error: "All 100 Founding Creator numbers have been permanently issued." }, { status: 409 });
      await CreatorProfile.updateOne({ _id: profile._id }, { $set: { foundingCreator: { number: allocation.issuance.number, status: allocation.issuance.status, grantedAt: allocation.issuance.grantedAt, grantedBy: allocation.issuance.grantedBy } } });
      return NextResponse.json({ ok: true, number: allocation.issuance.number, status: allocation.issuance.status }, { status: allocation.created ? 201 : 200 });
    }
    if (!existing) return NextResponse.json({ error: "Founding Creator issuance not found." }, { status: 404 });
    if (parsed.data.action === "revoke") { if (existing.status === "revoked") return NextResponse.json({ ok: true, number: existing.number, status: existing.status }); existing.status = "revoked"; existing.revokedAt = now; existing.revokedBy = admin.userId; existing.revocationReason = parsed.data.reason; existing.audit.push({ action: "revoke", actor: admin.userId, at: now, reason: parsed.data.reason }); }
    else { existing.status = "active"; existing.audit.push({ action: "restore", actor: admin.userId, at: now, reason: parsed.data.reason }); }
    await existing.save();
    await CreatorProfile.updateOne({ _id: profile._id }, { $set: { foundingCreator: { number: existing.number, status: existing.status, grantedAt: existing.grantedAt, grantedBy: existing.grantedBy, revokedAt: existing.revokedAt, revokedBy: existing.revokedBy, revocationReason: existing.revocationReason } } });
    return NextResponse.json({ ok: true, number: existing.number, status: existing.status });
  } catch (error) { return handleRouteError(error, "Founding Creator update failed", "Could not update Founding Creator status."); }
}
