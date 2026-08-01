import "server-only";

import type { ReactNode } from "react";
import { Resend } from "resend";

import { isValidEmailAddress, normalizedEmailError, readEmailEnvironment, type EmailEnvironmentInput } from "./email-config";

export type EmailSendResult = {
  status: "sent" | "failed" | "skipped";
  providerId: string | null;
  error: string | null;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactNode;
  text?: string;
  idempotencyKey?: string;
  sender?: "product" | "security";
};

export type EmailProvider = {
  send(input: {
    from: string;
    to: string;
    subject: string;
    react: ReactNode;
    text?: string;
    replyTo: string;
    headers?: Record<string, string>;
  }): Promise<{ data: { id: string } | null; error: { message?: string } | null }>;
};

export type EmailServiceDependencies = {
  env?: EmailEnvironmentInput;
  provider?: EmailProvider;
};

function providerFor(apiKey: string): EmailProvider {
  const resend = new Resend(apiKey);
  return { send: (input) => resend.emails.send(input) };
}

export async function sendEmail(
  { to, subject, react, text, idempotencyKey, sender = "product" }: SendEmailInput,
  dependencies: EmailServiceDependencies = {},
): Promise<EmailSendResult> {
  const recipient = to.trim().toLowerCase();
  if (!isValidEmailAddress(recipient)) {
    return { status: "failed", providerId: null, error: "A valid recipient email address is required." };
  }

  try {
    const config = readEmailEnvironment(dependencies.env);
    if (!config.apiKey && !dependencies.provider) {
      return { status: "skipped", providerId: null, error: "Email delivery is not configured." };
    }
    const result = await (dependencies.provider ?? providerFor(config.apiKey)).send({
      from: sender === "security" ? config.securityFrom : config.from,
      to: recipient,
      subject,
      react,
      text,
      replyTo: config.replyTo,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
    if (result.error || !result.data?.id) {
      return { status: "failed", providerId: null, error: normalizedEmailError(result.error) };
    }
    return { status: "sent", providerId: result.data.id, error: null };
  } catch (error) {
    return { status: "failed", providerId: null, error: normalizedEmailError(error) };
  }
}
