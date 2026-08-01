import { EmailNotification, type EmailNotificationStatus } from "@/lib/models/EmailNotification";
import { Webhook } from "svix";

export const RESEND_EMAIL_EVENTS = [
  "email.sent", "email.delivered", "email.delivery_delayed", "email.bounced",
  "email.complained", "email.failed", "email.suppressed",
] as const;
export type ResendEmailEvent = typeof RESEND_EMAIL_EVENTS[number];

const terminal = new Set<EmailNotificationStatus>(["delivered", "bounced", "complained", "suppressed", "permanent_failed"]);
const statusFor: Record<ResendEmailEvent, EmailNotificationStatus> = {
  "email.sent": "sent", "email.delivered": "delivered", "email.delivery_delayed": "delayed",
  "email.bounced": "bounced", "email.complained": "complained", "email.failed": "failed",
  "email.suppressed": "suppressed",
};

export function mayTransition(current: EmailNotificationStatus, next: EmailNotificationStatus) {
  if (current === next) return true;
  if (terminal.has(current)) return false;
  if (next === "sent" && ["delivered", "delayed"].includes(current)) return false;
  return true;
}

export function verifyResendWebhook(raw: string, secret: string, headers: { id: string; timestamp: string; signature: string }) {
  return new Webhook(secret).verify(raw, {
    "svix-id": headers.id, "svix-timestamp": headers.timestamp, "svix-signature": headers.signature,
  });
}

export async function processResendWebhook(input: {
  eventId: string; type: string; createdAt?: string; emailId?: string;
}) {
  if (!RESEND_EMAIL_EVENTS.includes(input.type as ResendEmailEvent) || !input.emailId) return { ignored: true };
  const record = await EmailNotification.findOne({ providerId: input.emailId });
  if (!record) return { ignored: true };
  if (record.webhookEventIds.includes(input.eventId)) return { duplicate: true };
  const next = statusFor[input.type as ResendEmailEvent];
  const eventTime = input.createdAt ? new Date(input.createdAt) : new Date();
  if (!mayTransition(record.status, next) || (record.providerUpdatedAt && eventTime < record.providerUpdatedAt)) {
    await EmailNotification.updateOne({ _id: record._id, webhookEventIds: { $ne: input.eventId } }, { $addToSet: { webhookEventIds: input.eventId } });
    return { ignored: true };
  }
  await EmailNotification.updateOne(
    { _id: record._id, webhookEventIds: { $ne: input.eventId } },
    {
      $set: {
        status: next, providerUpdatedAt: eventTime,
        ...(next === "delivered" ? { deliveredAt: eventTime } : {}),
        retryable: next === "failed",
        ...(terminal.has(next) ? { nextRetryAt: null } : {}),
      },
      $addToSet: { webhookEventIds: input.eventId },
    },
  );
  return { processed: true };
}
