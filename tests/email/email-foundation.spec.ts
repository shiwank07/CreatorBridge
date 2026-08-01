import { expect, test } from "@playwright/test";
import BrandWelcomeEmail, { brandWelcomeBenefits, brandWelcomeSubject, brandWelcomeText } from "../../emails/brand-welcome";
import CreatorWelcomeEmail, { creatorWelcomeBenefits, creatorWelcomeSubject, creatorWelcomeText } from "../../emails/creator-welcome";
import {
  CollaborationAcceptedEmail, CollaborationDeclinedEmail, CollaborationInvitationEmail, ContactConfirmationEmail,
  VerificationApprovedEmail, VerificationRejectedEmail, collaborationAcceptedPreviewProps, collaborationAcceptedSubject,
  collaborationAcceptedText, collaborationDeclinedPreviewProps, collaborationDeclinedSubject, collaborationDeclinedText,
  collaborationInvitationPreviewProps, collaborationInvitationSubject, collaborationInvitationText,
  contactConfirmationPreviewProps, contactConfirmationSubject, contactConfirmationText, verificationApprovedPreviewProps,
  verificationApprovedSubject, verificationApprovedText, verificationRejectedPreviewProps, verificationRejectedSubject,
  verificationRejectedText,
} from "../../emails/core-product-emails";
import {
  DEFAULT_EMAIL_FROM,
  DEFAULT_EMAIL_SECURITY_FROM,
  DEFAULT_EMAIL_REPLY_TO,
  absoluteAppUrl,
  isValidEmailAddress,
  isValidSender,
  normalizedEmailError,
  readEmailEnvironment,
  resolveEmailLogoUrl,
} from "../../lib/email/email-config";
import { isPermanentRecipientFailure, preferenceAllowsEmail } from "../../lib/email/email-policy";
import {
  AccountSecurityAlertEmail, ContactAdminAlertEmail, accountSecurityAlertPreviewProps,
  accountSecurityAlertSubject, accountSecurityAlertText, contactAdminAlertPreviewProps, contactAdminAlertText,
} from "../../emails/operational-emails";
import { mayTransition, verifyResendWebhook } from "../../lib/email/resend-webhook";
import { Webhook } from "svix";
import { acceptsContactContentType, contactRequestTooLarge, contactSubmissionSchema } from "../../lib/contact-security";

const validEnv = {
  NODE_ENV: "production",
  RESEND_API_KEY: "test_key_not_real",
  NEXT_PUBLIC_APP_URL: "https://branzzo.com",
  EMAIL_FROM: DEFAULT_EMAIL_FROM,
  EMAIL_REPLY_TO: DEFAULT_EMAIL_REPLY_TO,
  EMAIL_SECURITY_FROM: DEFAULT_EMAIL_SECURITY_FROM,
  EMAIL_LOGO_URL: "https://branzzo.com/branding/branzzo-logo.png",
};

test("uses the verified sender and support reply-to", () => {
  const config = readEmailEnvironment(validEnv);
  expect(config.from).toBe("Branzzo <notifications@updates.branzzo.com>");
  expect(config.replyTo).toBe("support@branzzo.com");
  expect(config.securityFrom).toBe("Branzzo Security <security@updates.branzzo.com>");
  expect(isValidSender(config.from)).toBeTruthy();
  expect(isValidSender("Branzzo <hello@example.com>")).toBeFalsy();
});

test("restricts both senders and real-send logo assets", () => {
  expect(() => readEmailEnvironment({ ...validEnv, EMAIL_SECURITY_FROM: "Security <security@example.com>" })).toThrow(/EMAIL_SECURITY_FROM/);
  expect(() => readEmailEnvironment({ ...validEnv, EMAIL_LOGO_URL: "http://localhost:3000/branding/branzzo-logo.png" })).toThrow(/public HTTPS/);
  expect(resolveEmailLogoUrl({ NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" }))
    .toBe("http://localhost:3000/branding/branzzo-logo.png");
  expect(resolveEmailLogoUrl({ NODE_ENV: "production", RESEND_API_KEY: "unused", EMAIL_ASSET_BASE_URL: "https://branzzo.com" }))
    .toBe("https://branzzo.com/branding/branzzo-logo.png");
});

test("operational templates provide safe subjects, text, and renderable trees", () => {
  expect(accountSecurityAlertSubject()).not.toContain(accountSecurityAlertPreviewProps.changed);
  expect(accountSecurityAlertText(accountSecurityAlertPreviewProps)).toContain("If you do not recognize this activity");
  expect(contactAdminAlertText(contactAdminAlertPreviewProps)).toContain(contactAdminAlertPreviewProps.messagePreview);
  expect(JSON.stringify(AccountSecurityAlertEmail(accountSecurityAlertPreviewProps))).toContain("Review account");
  expect(JSON.stringify(ContactAdminAlertEmail(contactAdminAlertPreviewProps))).toContain("Open contact record");
});

test("webhook status transitions do not move terminal states backwards", () => {
  expect(mayTransition("sent", "delivered")).toBeTruthy();
  expect(mayTransition("delivered", "sent")).toBeFalsy();
  expect(mayTransition("bounced", "delivered")).toBeFalsy();
  expect(mayTransition("complained", "failed")).toBeFalsy();
});

test("webhook verification rejects invalid signatures", () => {
  const secret = `whsec_${Buffer.from("test-secret-value").toString("base64")}`;
  const payload = JSON.stringify({ type: "email.sent", data: { email_id: "email_1" } });
  const id = "msg_test";
  const date = new Date();
  const timestamp = Math.floor(date.getTime() / 1000).toString();
  const signature = new Webhook(secret).sign(id, date, payload);
  expect(verifyResendWebhook(payload, secret, { id, timestamp, signature })).toBeTruthy();
  expect(() => verifyResendWebhook(`${payload} `, secret, { id, timestamp, signature })).toThrow();
});

test("contact payload validation rejects bots, invalid fields, and oversized requests", () => {
  const valid = { name: "Maya Rao", email: "maya@example.com", topic: "support", subject: "Account help", message: "I need assistance with my Branzzo account.", companyWebsite: "" };
  expect(contactSubmissionSchema.safeParse(valid).success).toBeTruthy();
  expect(contactSubmissionSchema.safeParse({ ...valid, email: "invalid" }).success).toBeFalsy();
  expect(contactSubmissionSchema.safeParse({ ...valid, companyWebsite: "https://bot.example" }).success).toBeFalsy();
  expect(acceptsContactContentType("application/json; charset=utf-8")).toBeTruthy();
  expect(acceptsContactContentType("text/plain")).toBeFalsy();
  expect(contactRequestTooLarge("8193")).toBeTruthy();
});

test("rejects missing production credentials and localhost", () => {
  expect(() => readEmailEnvironment({ ...validEnv, RESEND_API_KEY: "" })).toThrow(/RESEND_API_KEY/);
  expect(() => readEmailEnvironment({ ...validEnv, NEXT_PUBLIC_APP_URL: "http://localhost:3000" })).toThrow(/localhost/);
});

test("builds absolute CTA URLs", () => {
  expect(absoluteAppUrl("/creators", "https://branzzo.com")).toBe("https://branzzo.com/creators");
  expect(isValidEmailAddress("person@example.com")).toBeTruthy();
  expect(isValidEmailAddress("not-an-address")).toBeFalsy();
});

test("normalizes provider errors without leaking provider internals", () => {
  const safe = normalizedEmailError(new Error("provider secret diagnostic"));
  expect(safe).toBe("The email could not be sent. Please try again later.");
  expect(safe).not.toContain("provider secret diagnostic");
});

test("email preferences and permanent recipient failures are enforced", () => {
  expect(preferenceAllowsEmail(undefined, "collaborationInvitations")).toBeTruthy();
  expect(preferenceAllowsEmail({ collaborationInvitations: false }, "collaborationInvitations")).toBeFalsy();
  expect(preferenceAllowsEmail({ collaborationInvitations: false }, "verificationUpdates")).toBeTruthy();
  expect(isPermanentRecipientFailure({ status: "failed", providerId: null, error: "A valid recipient email address is required." })).toBeTruthy();
  expect(isPermanentRecipientFailure({ status: "failed", providerId: null, error: "The email could not be sent. Please try again later." })).toBeFalsy();
});

test("welcome subjects and plain text are meaningful", () => {
  expect(creatorWelcomeSubject()).toContain("Welcome to Branzzo");
  expect(brandWelcomeSubject()).toContain("discover creators");
  const creatorText = creatorWelcomeText({ profileUrl: "https://branzzo.com/profile" });
  const brandText = brandWelcomeText({ firstName: "Maya", discoverUrl: "https://branzzo.com/creators" });
  expect(creatorText).toContain("Hi there");
  expect(creatorText).toContain("Welcome to Branzzo—where creators and brands build meaningful collaborations.");
  expect(brandText).toContain("Hi Maya");
  expect(brandText).toContain("Thanks for joining Branzzo. We’re excited to help you discover creators who fit your brand.");
  for (const benefit of creatorWelcomeBenefits) expect(creatorText).toContain(`- ${benefit}`);
  for (const benefit of brandWelcomeBenefits) expect(brandText).toContain(`- ${benefit}`);
  expect(creatorText).toContain("Complete your creator profile: https://branzzo.com/profile");
  expect(brandText).toContain("Discover creators: https://branzzo.com/creators");
  expect(creatorText).toContain("Helping creators and brands build better partnerships.");
  expect(brandText).toContain("Helping creators and brands build better partnerships.");
});

test("creates both template trees with absolute CTA props", () => {
  const creator = CreatorWelcomeEmail({
    firstName: "Maya",
    profileUrl: "https://branzzo.com/dashboard/creator/edit",
  });
  const brand = BrandWelcomeEmail({
    discoverUrl: "https://branzzo.com/creators",
  });
  const creatorTree = JSON.stringify(creator);
  const brandTree = JSON.stringify(brand);
  expect(creatorTree).toContain("https://branzzo.com/dashboard/creator/edit");
  expect(brandTree).toContain("https://branzzo.com/creators");
  expect(creatorTree).toContain("Welcome to Branzzo");
  for (const benefit of creatorWelcomeBenefits) expect(creatorTree).toContain(benefit);
  for (const benefit of brandWelcomeBenefits) expect(brandTree).toContain(benefit);
});

test("Stage 2 subjects remain concise and contain no user-controlled data", () => {
  expect(collaborationInvitationSubject()).toBe("New collaboration invitation on Branzzo");
  expect(collaborationAcceptedSubject()).toBe("Your Branzzo collaboration was accepted");
  expect(collaborationDeclinedSubject()).toBe("Collaboration update on Branzzo");
  expect(verificationApprovedSubject()).toBe("Your Branzzo creator profile is verified");
  expect(verificationRejectedSubject()).toBe("Action needed for your Branzzo verification");
  expect(contactConfirmationSubject()).toBe("We received your Branzzo message");
});

test("Stage 2 plain text includes CTA, support, and safely omits missing optional data", () => {
  const cases = [
    [collaborationInvitationText({ ...collaborationInvitationPreviewProps, budget: null, message: null }), collaborationInvitationPreviewProps.collaborationUrl],
    [collaborationAcceptedText(collaborationAcceptedPreviewProps), collaborationAcceptedPreviewProps.collaborationUrl],
    [collaborationDeclinedText(collaborationDeclinedPreviewProps), collaborationDeclinedPreviewProps.collaborationsUrl],
    [verificationApprovedText(verificationApprovedPreviewProps), verificationApprovedPreviewProps.profileUrl],
    [verificationRejectedText({ ...verificationRejectedPreviewProps, reason: null }), verificationRejectedPreviewProps.verificationUrl],
    [contactConfirmationText(contactConfirmationPreviewProps), contactConfirmationPreviewProps.websiteUrl],
  ];
  for (const [text, url] of cases) {
    expect(text).toContain(url);
    expect(text).toContain("support@branzzo.com");
    expect(text).toContain("Helping creators and brands build better partnerships.");
  }
  expect(cases[0][0]).not.toContain("Budget:");
  expect(cases[4][0]).not.toContain("Reason:");
});

test("Stage 2 templates create renderable trees with absolute links", () => {
  const trees = [
    CollaborationInvitationEmail(collaborationInvitationPreviewProps),
    CollaborationAcceptedEmail(collaborationAcceptedPreviewProps),
    CollaborationDeclinedEmail(collaborationDeclinedPreviewProps),
    VerificationApprovedEmail(verificationApprovedPreviewProps),
    VerificationRejectedEmail(verificationRejectedPreviewProps),
    ContactConfirmationEmail(contactConfirmationPreviewProps),
  ].map((tree) => JSON.stringify(tree));
  expect(trees.every((tree) => tree.includes("http://localhost:3000"))).toBeTruthy();
});
