import { NextResponse } from "next/server";

import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { sendBrandWelcome, sendCreatorWelcome } from "@/lib/email/welcome-emails";
import {
  sendCollaborationAccepted, sendCollaborationDeclined, sendCollaborationInvitation, sendContactConfirmation,
  sendVerificationApproved, sendVerificationRejected, sendAccountSecurityAlert, sendContactAdminAlert,
} from "@/lib/email/core-email-service";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const recipient = process.env.EMAIL_TEST_RECIPIENT?.trim().toLowerCase();
  if (!recipient) return NextResponse.json({ error: "EMAIL_TEST_RECIPIENT is not configured." }, { status: 503 });
  if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
  await connectDB();

  const body = await request.json().catch(() => ({})) as { template?: string };
  const template = body.template ?? "creator";
  const eventId = `manual-${template}-${Date.now()}`;
  const idempotencyKey = eventId;
  const base = "http://localhost:3000";
  const sends: Record<string, () => Promise<{ status: string; providerId: string | null; error: string | null }>> = {
    creator: () => sendCreatorWelcome({ to: recipient, firstName: "Branzzo tester", idempotencyKey }),
    brand: () => sendBrandWelcome({ to: recipient, firstName: "Branzzo tester", idempotencyKey }),
    "collaboration-invitation": () => sendCollaborationInvitation({ to: recipient, eventId, firstName: "Branzzo tester", brandName: "Northstar Labs", title: "Creator partnership", collaborationUrl: `${base}/dashboard/history` }),
    "collaboration-accepted": () => sendCollaborationAccepted({ to: recipient, eventId, firstName: "Branzzo tester", creatorName: "Maya", title: "Creator partnership", collaborationUrl: `${base}/dashboard/history` }),
    "collaboration-declined": () => sendCollaborationDeclined({ to: recipient, eventId, firstName: "Branzzo tester", title: "Creator partnership", collaborationsUrl: `${base}/dashboard/history` }),
    "verification-approved": () => sendVerificationApproved({ to: recipient, eventId, firstName: "Branzzo tester", profileUrl: `${base}/dashboard/creator` }),
    "verification-rejected": () => sendVerificationRejected({ to: recipient, eventId, firstName: "Branzzo tester", reason: "Please review the submitted ownership evidence.", verificationUrl: `${base}/dashboard/verification` }),
    "contact-confirmation": () => sendContactConfirmation({ to: recipient, eventId, firstName: "Branzzo tester", websiteUrl: base }),
    "account-security-alert": () => sendAccountSecurityAlert({
      to: recipient, eventId, firstName: "Branzzo tester", alertType: "important_account_notice",
      changed: "An administrator updated your Branzzo account.", actionTime: new Date().toISOString(), actionUrl: `${base}/dashboard`,
    }),
    "contact-admin-alert": () => sendContactAdminAlert({
      to: recipient, eventId, senderName: "Branzzo tester", senderEmail: recipient, category: "support",
      messagePreview: "Manual contact alert preview.", contactUrl: `${base}/admin/contacts`,
    }),
  };
  const send = sends[template];
  if (!send) return NextResponse.json({ error: "Unknown email template." }, { status: 400 });
  const result = await send();

  return NextResponse.json({ status: result.status, messageId: result.providerId, error: result.error });
}
