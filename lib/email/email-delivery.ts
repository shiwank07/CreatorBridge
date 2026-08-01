import "server-only";

import { EmailNotification } from "@/lib/models/EmailNotification";
import type { EmailSendResult } from "./email-service";
import { isPermanentRecipientFailure, preferenceAllowsEmail, type EmailPreferenceSnapshot, type TransactionalPreference } from "./email-policy";
import { EMAIL_MAX_ATTEMPTS, retryDelayMs } from "./retry-policy";

type DeliverOnceInput = {
  deliveryKey: string;
  recipient: string;
  event: string;
  send: () => Promise<EmailSendResult>;
  preferences?: EmailPreferenceSnapshot;
  preference?: TransactionalPreference;
  retryFailed?: boolean;
};

export async function deliverEmailOnce(input: DeliverOnceInput): Promise<EmailSendResult & { duplicate?: boolean }> {
  if (!preferenceAllowsEmail(input.preferences, input.preference)) {
    return { status: "skipped", providerId: null, error: "Disabled by email preference." };
  }

  const now = new Date();
  let claim;
  try {
    claim = await EmailNotification.findOneAndUpdate(
      input.retryFailed
        ? { deliveryKey: input.deliveryKey, status: "failed", retryable: true, attempts: { $lt: EMAIL_MAX_ATTEMPTS }, nextRetryAt: { $lte: now } }
        : { deliveryKey: input.deliveryKey, status: { $exists: false } },
      {
        $setOnInsert: { deliveryKey: input.deliveryKey, recipient: input.recipient, event: input.event, createdAt: now },
        $set: { status: "processing", error: null, lastAttemptAt: now, updatedAt: now },
        $inc: { attempts: 1 },
      },
      { upsert: !input.retryFailed, new: true },
    );
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return { status: "skipped", providerId: null, error: null, duplicate: true };
    }
    throw error;
  }

  if (!claim) return { status: "skipped", providerId: null, error: null, duplicate: true };

  let result: EmailSendResult;
  try {
    result = await input.send();
  } catch {
    result = { status: "failed", providerId: null, error: "The email could not be sent. Please try again later." };
  }
  const status = isPermanentRecipientFailure(result) ? "permanent_failed" : result.status;
  const retryable = result.status === "failed" && !isPermanentRecipientFailure(result) && claim.attempts < EMAIL_MAX_ATTEMPTS;
  await EmailNotification.updateOne(
    { _id: claim._id, status: "processing" },
    { $set: {
      status, providerId: result.providerId, error: result.error, retryable,
      nextRetryAt: retryable ? new Date(Date.now() + retryDelayMs(claim.attempts)) : null,
      updatedAt: new Date(),
    } },
  );
  return result;
}
