import { render } from "@react-email/render";
import { createElement } from "react";
import { NextResponse } from "next/server";

import BrandWelcomeEmail, { brandWelcomePreviewProps } from "@/emails/brand-welcome";
import CreatorWelcomeEmail, { creatorWelcomePreviewProps } from "@/emails/creator-welcome";
import {
  CollaborationAcceptedEmail, CollaborationDeclinedEmail, CollaborationInvitationEmail, ContactConfirmationEmail,
  VerificationApprovedEmail, VerificationRejectedEmail, collaborationAcceptedPreviewProps,
  collaborationDeclinedPreviewProps, collaborationInvitationPreviewProps, contactConfirmationPreviewProps,
  verificationApprovedPreviewProps, verificationRejectedPreviewProps,
} from "@/emails/core-product-emails";
import {
  AccountSecurityAlertEmail, ContactAdminAlertEmail,
  accountSecurityAlertPreviewProps, contactAdminAlertPreviewProps,
} from "@/emails/operational-emails";

export const dynamic = "force-dynamic";

const previews = {
  creator: createElement(CreatorWelcomeEmail, creatorWelcomePreviewProps),
  brand: createElement(BrandWelcomeEmail, brandWelcomePreviewProps),
  "collaboration-invitation": createElement(CollaborationInvitationEmail, collaborationInvitationPreviewProps),
  "collaboration-accepted": createElement(CollaborationAcceptedEmail, collaborationAcceptedPreviewProps),
  "collaboration-declined": createElement(CollaborationDeclinedEmail, collaborationDeclinedPreviewProps),
  "verification-approved": createElement(VerificationApprovedEmail, verificationApprovedPreviewProps),
  "verification-rejected": createElement(VerificationRejectedEmail, verificationRejectedPreviewProps),
  "contact-confirmation": createElement(ContactConfirmationEmail, contactConfirmationPreviewProps),
  "account-security-alert": createElement(AccountSecurityAlertEmail, accountSecurityAlertPreviewProps),
  "contact-admin-alert": createElement(ContactAdminAlertEmail, contactAdminAlertPreviewProps),
};

export async function GET(_request: Request, context: { params: Promise<{ template: string }> }) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  const { template } = await context.params;
  const preview = previews[template as keyof typeof previews];
  if (!preview) return NextResponse.json({ error: "Unknown email template." }, { status: 404 });
  return new NextResponse(await render(preview), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
