import { NextResponse } from "next/server";

import { connectDB, hasMongoUri } from "@/lib/db";
import { processResendWebhook, verifyResendWebhook } from "@/lib/email/resend-webhook";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret || !hasMongoUri()) return NextResponse.json({ ok: false }, { status: 503 });
  const eventId = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!eventId || !timestamp || !signature) return NextResponse.json({ ok: false }, { status: 401 });
  const raw = await request.text();
  let payload: unknown;
  try {
    payload = verifyResendWebhook(raw, secret, { id: eventId, timestamp, signature });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const event = payload as { type?: string; created_at?: string; data?: { email_id?: string } };
  await connectDB();
  await processResendWebhook({ eventId, type: event.type ?? "", createdAt: event.created_at, emailId: event.data?.email_id });
  return NextResponse.json({ ok: true });
}
