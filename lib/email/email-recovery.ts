import { EmailNotification } from "@/lib/models/EmailNotification";
import { EMAIL_MAX_ATTEMPTS, retryDelayMs } from "./retry-policy";

export async function recoverStaleEmailProcessing(options: { timeoutMs?: number; now?: Date } = {}) {
  const now = options.now ?? new Date();
  const timeoutMs = options.timeoutMs ?? Number(process.env.EMAIL_PROCESSING_TIMEOUT_MS || 15 * 60_000);
  const staleBefore = new Date(now.getTime() - timeoutMs);
  const result = await EmailNotification.updateMany(
    { status: "processing", lastAttemptAt: { $lte: staleBefore }, attempts: { $lt: EMAIL_MAX_ATTEMPTS } },
    {
      $set: {
        status: "failed", retryable: true, error: "Delivery processing timed out.",
        nextRetryAt: new Date(now.getTime() + retryDelayMs(1)), updatedAt: now,
      },
    },
  );
  await EmailNotification.updateMany(
    { status: "processing", lastAttemptAt: { $lte: staleBefore }, attempts: { $gte: EMAIL_MAX_ATTEMPTS } },
    { $set: { status: "permanent_failed", retryable: false, error: "Delivery attempts exhausted.", nextRetryAt: null, updatedAt: now } },
  );
  return result.modifiedCount;
}

export async function claimTransientRetry(id: string, now = new Date()) {
  return EmailNotification.findOneAndUpdate(
    { _id: id, status: "failed", retryable: true, attempts: { $lt: EMAIL_MAX_ATTEMPTS }, nextRetryAt: { $lte: now } },
    { $set: { status: "processing", lastAttemptAt: now, updatedAt: now }, $inc: { attempts: 1 } },
    { new: true },
  );
}
