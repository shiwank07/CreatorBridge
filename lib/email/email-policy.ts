import type { EmailSendResult } from "./email-service";

export type TransactionalPreference = "collaborationInvitations" | "collaborationStatusUpdates" | "verificationUpdates";
export type EmailPreferenceSnapshot = Partial<Record<TransactionalPreference, boolean>>;

export function preferenceAllowsEmail(preferences: EmailPreferenceSnapshot | undefined, preference?: TransactionalPreference) {
  return !preference || preferences?.[preference] !== false;
}

export function isPermanentRecipientFailure(result: EmailSendResult) {
  return result.status === "failed" && result.error === "A valid recipient email address is required.";
}
