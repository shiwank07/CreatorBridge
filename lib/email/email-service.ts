import type { ReactNode } from "react";
import { Resend } from "resend";

export type EmailSendResult = {
  status: "sent" | "skipped";
  providerId: string | null;
  error: string | null;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactNode;
  text?: string;
};

let resendClient: Resend | null = null;

function getResendClient(apiKey: string) {
  resendClient ??= new Resend(apiKey);
  return resendClient;
}

function missingEmailConfig() {
  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY?.trim()) missing.push("RESEND_API_KEY");
  if (!process.env.EMAIL_FROM?.trim()) missing.push("EMAIL_FROM");
  return missing;
}

export async function sendEmail({ to, subject, react, text }: SendEmailInput): Promise<EmailSendResult> {
  const missing = missingEmailConfig();
  if (missing.length) {
    const error = `Email skipped because ${missing.join(", ")} is not configured.`;
    console.warn(`[email] ${error}`);
    return { status: "skipped", providerId: null, error };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const result = await getResendClient(apiKey).emails.send({
    from,
    to,
    subject,
    react,
    text,
  });

  if (result.error) {
    throw new Error(result.error.message || "Resend email send failed.");
  }

  return {
    status: "sent",
    providerId: result.data?.id ?? null,
    error: null,
  };
}
