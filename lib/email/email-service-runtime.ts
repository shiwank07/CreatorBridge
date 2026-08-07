import type { ReactNode } from "react";
import { Resend } from "resend";

import { isValidEmailAddress, normalizedEmailError, readEmailEnvironment, type EmailEnvironmentInput } from "./email-config";

export type EmailSendResult = { status: "sent" | "failed" | "skipped"; providerId: string | null; error: string | null };
export type SendEmailInput = { to: string; subject: string; react: ReactNode; text?: string; idempotencyKey?: string; sender?: "product" | "security" };
export type EmailProvider = {
  send(input: { from: string; to: string; subject: string; react: ReactNode; text?: string; replyTo: string; headers?: Record<string, string> }):
    Promise<{ data: { id: string } | null; error: { message?: string } | null }>;
};
export type EmailServiceDependencies = { env?: EmailEnvironmentInput; provider?: EmailProvider };

function providerFor(apiKey: string): EmailProvider {
  const resend = new Resend(apiKey);
  return { send: (input) => resend.emails.send(input) };
}

function logDelivery(outcome: "missing_recipient" | "missing_configuration" | "render_failed" | "provider_request_started" | "provider_accepted" | "provider_rejected", details: Record<string, unknown> = {}) {
  const method = outcome === "provider_rejected" ? console.error : outcome.startsWith("provider_") ? console.info : console.warn;
  method("[email] Delivery state.", { outcome, ...details });
}

export async function sendEmail(
  { to, subject, react, text, idempotencyKey, sender = "product" }: SendEmailInput,
  dependencies: EmailServiceDependencies = {},
): Promise<EmailSendResult> {
  const recipient = to.trim().toLowerCase();
  if (!isValidEmailAddress(recipient)) {
    logDelivery("missing_recipient", { recipientEmailExists: Boolean(recipient) });
    return { status: "failed", providerId: null, error: "A valid recipient email address is required." };
  }
  try {
    const config = readEmailEnvironment(dependencies.env);
    if (!config.apiKey && !dependencies.provider) {
      logDelivery("missing_configuration", { resendApiKeyExists: false });
      return { status: "skipped", providerId: null, error: "Email delivery is not configured." };
    }
    logDelivery("provider_request_started", { recipientEmailExists: true });
    const result = await (dependencies.provider ?? providerFor(config.apiKey)).send({
      from: sender === "security" ? config.securityFrom : config.from, to: recipient, subject, react, text,
      replyTo: config.replyTo, headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
    if (result.error || !result.data?.id) {
      logDelivery("provider_rejected", { recipientEmailExists: true, errorClass: "provider_response_error" });
      return { status: "failed", providerId: null, error: normalizedEmailError(result.error) };
    }
    logDelivery("provider_accepted", { recipientEmailExists: true, providerId: result.data.id });
    return { status: "sent", providerId: result.data.id, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("RESEND_API_KEY")) {
      logDelivery("missing_configuration", { resendApiKeyExists: false });
    } else if (/render|react email/i.test(message)) {
      logDelivery("render_failed", { recipientEmailExists: true, errorClass: "template_render_error" });
    } else {
      logDelivery("provider_rejected", { recipientEmailExists: true, errorClass: "provider_request_error" });
    }
    return { status: "failed", providerId: null, error: normalizedEmailError(error) };
  }
}
