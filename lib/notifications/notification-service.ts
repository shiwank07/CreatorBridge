import { createElement, type ReactElement } from "react";
import mongoose from "mongoose";

import CreatorAcceptedEmail from "@/emails/creator-accepted";
import CreatorDeclinedEmail from "@/emails/creator-declined";
import CollaborationCompletedEmail from "@/emails/collaboration-completed";
import DeliveryApprovedEmail from "@/emails/delivery-approved";
import DeliveryChangesRequestedEmail from "@/emails/delivery-changes-requested";
import NewCollaborationEmail from "@/emails/new-collaboration";
import ProofSubmittedEmail from "@/emails/proof-submitted";
import VerificationApprovedEmail from "@/emails/verification-approved";
import VerificationRejectedEmail from "@/emails/verification-rejected";
import { collaborationDetailsHref } from "@/lib/collaboration-routes";
import { sendEmail } from "@/lib/email/email-service";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { EmailNotification, type EmailNotificationStatus } from "@/lib/models/EmailNotification";
import { User } from "@/lib/models/User";

export type NotificationEvent =
  | "collaboration_request"
  | "new_collaboration"
  | "brand_response"
  | "counter_requested"
  | "counter_sent"
  | "creator_accepted"
  | "creator_declined"
  | "proof_submitted"
  | "delivery_approved"
  | "delivery_changes_requested"
  | "collaboration_completed"
  | "verification_approved"
  | "verification_rejected"
  | "featured_creator"
  | "admin_notice"
  | "system_update";

type NotificationUser = {
  _id?: unknown;
  id?: string | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

type DeliveryProofLike = {
  videoUrl?: string;
  timestampStart?: string;
  timestampEnd?: string;
  notes?: string;
  screenshotUrl?: string;
  referenceLink?: string;
};

type CollaborationLike = {
  _id?: unknown;
  companyName?: string;
  contactName?: string;
  email?: string;
  campaignGoal?: string;
  budgetRange?: string;
  timeline?: string;
  creatorUsername?: string;
  creatorUserId?: unknown;
  brandUserId?: unknown;
  createdByClerkId?: string;
  deliveryProof?: DeliveryProofLike | null;
};

type SendNotificationInput = {
  recipient?: string | null;
  event: NotificationEvent;
  subject: string;
  react: ReactElement;
};

type NotificationRecordInput = {
  recipient: string;
  event: NotificationEvent;
  status: EmailNotificationStatus;
  providerId: string | null;
  error: string | null;
};

type InAppNotificationInput = {
  recipientUserId?: unknown;
  actorUserId?: unknown;
  event: NotificationEvent;
  title: string;
  message: string;
  href: string;
};

type VerificationNotificationInput = {
  user: NotificationUser;
  accountType: "creator" | "brand";
  note?: string;
  statusLabel?: string;
};

function trimText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown notification error.";
  }
}

function truncate(value: string, maxLength = 1000) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function normalizeRecipient(recipient?: string | null) {
  return recipient?.trim().toLowerCase() ?? "";
}

function maskEmailLikeValues(value: string) {
  return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => {
    const [localPart, domain] = email.split("@");
    const visiblePrefix = localPart?.slice(0, 1) || "*";
    return `${visiblePrefix}***@${domain}`;
  });
}

function sanitizeLogMessage(value: string) {
  return maskEmailLikeValues(value).replace(/re_[A-Za-z0-9_-]+/g, "[resend_api_key]");
}

function safeEmailFromValue() {
  const value = process.env.EMAIL_FROM?.trim();
  return value ? maskEmailLikeValues(value) : "(not configured)";
}

function emailConfigLogSnapshot() {
  return {
    resendApiKeyExists: Boolean(process.env.RESEND_API_KEY?.trim()),
    emailFrom: safeEmailFromValue(),
  };
}

function appUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function collaborationId(collaboration: CollaborationLike) {
  return collaboration._id ? String(collaboration._id) : "";
}

function collaborationHref(collaboration: CollaborationLike) {
  const id = collaborationId(collaboration);
  return collaborationDetailsHref(id || null);
}

function verificationUrl(accountType: "creator" | "brand") {
  return appUrl(accountType === "creator" ? "/dashboard/creator" : "/dashboard/brand");
}

function userDisplayName(user?: NotificationUser | null, fallback = "there") {
  return trimText(user?.name, trimText(user?.username, fallback));
}

function userObjectId(user?: NotificationUser | null) {
  return user?._id ?? user?.id ?? null;
}

function amountLabel(amount?: number | null) {
  return amount && amount > 0 ? ` at INR ${amount.toLocaleString("en-IN")}` : "";
}

function toObjectId(value: unknown) {
  if (!value) return null;

  const raw = typeof value === "string" ? value : value.toString();
  return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null;
}

async function resolveCreatorUser(collaboration: CollaborationLike, provided?: NotificationUser | null) {
  if (provided?.email) return provided;

  if (collaboration.creatorUserId) {
    const user = await User.findById(collaboration.creatorUserId).select("email name username").exec();
    if (user?.email) return user;
  }

  const username = trimText(collaboration.creatorUsername);
  if (!username) return null;

  return User.findOne({ username, role: "creator" }).select("email name username").exec();
}

async function resolveBrandUser(collaboration: CollaborationLike, provided?: NotificationUser | null) {
  if (provided?.email) return provided;

  if (collaboration.brandUserId) {
    const user = await User.findById(collaboration.brandUserId).select("email name username").exec();
    if (user?.email) return user;
  }

  if (collaboration.createdByClerkId) {
    const user = await User.findOne({ clerkId: collaboration.createdByClerkId }).select("email name username").exec();
    if (user?.email) return user;
  }

  const email = normalizeRecipient(collaboration.email);
  if (!email) return null;

  return User.findOne({ email }).select("email name username").exec();
}

async function createInAppNotification({ recipientUserId, actorUserId, event, title, message, href }: InAppNotificationInput) {
  const recipientId = toObjectId(recipientUserId);
  const actorId = toObjectId(actorUserId);
  if (!recipientId) return;

  try {
    await InAppNotification.create({
      recipientUserId: recipientId,
      actorUserId: actorId,
      event,
      title,
      message,
      href,
      isRead: false,
      readAt: null,
    });
  } catch (error) {
    console.error("[notifications] Could not store in-app notification.", {
      event,
      recipientUserId: String(recipientId),
      error: errorMessage(error),
    });
  }
}

async function recordNotification({ recipient, event, status, providerId, error }: NotificationRecordInput) {
  try {
    await EmailNotification.create({
      recipient,
      event,
      status,
      providerId,
      error: error ? truncate(error) : null,
    });
  } catch (recordError) {
    console.error("[notifications] Could not store notification history.", {
      event,
      recipientEmailExists: Boolean(recipient && recipient !== "unknown"),
      error: sanitizeLogMessage(errorMessage(recordError)),
    });
  }
}

async function sendAndRecord({ recipient, event, subject, react }: SendNotificationInput) {
  const normalizedRecipient = normalizeRecipient(recipient);
  const isNewCollaborationEmail = event === "new_collaboration";

  if (!normalizedRecipient) {
    const error = "Notification skipped because no recipient email was available.";
    await recordNotification({ recipient: "unknown", event, status: "skipped", providerId: null, error });
    console.warn("[notifications] Email skipped.", {
      event,
      recipientEmailExists: false,
      error: sanitizeLogMessage(error),
    });
    if (isNewCollaborationEmail) {
      console.warn("[notifications] Resend send skipped.", {
        event,
        recipientEmailExists: false,
        reason: "no_recipient_email",
      });
    }
    return;
  }

  try {
    const result = await sendEmail({ to: normalizedRecipient, subject, react });
    await recordNotification({
      recipient: normalizedRecipient,
      event,
      status: result.status,
      providerId: result.providerId,
      error: result.error,
    });

    if (result.status !== "sent") {
      console.warn("[notifications] Email skipped.", {
        event,
        recipientEmailExists: true,
        error: result.error ? sanitizeLogMessage(result.error) : null,
      });
      if (isNewCollaborationEmail) {
        console.warn("[notifications] Resend send skipped.", {
          event,
          recipientEmailExists: true,
          reason: "email_service_skipped",
          error: result.error ? sanitizeLogMessage(result.error) : null,
        });
      }
    } else {
      console.info("[notifications] Email sent.", {
        event,
        recipientEmailExists: true,
        providerId: result.providerId,
      });
      if (isNewCollaborationEmail) {
        console.info("[notifications] Resend send success.", {
          event,
          recipientEmailExists: true,
          providerId: result.providerId,
        });
      }
    }
  } catch (sendError) {
    const error = errorMessage(sendError);
    await recordNotification({ recipient: normalizedRecipient, event, status: "failed", providerId: null, error });
    console.error("[notifications] Email failed.", {
      event,
      recipientEmailExists: true,
      error: sanitizeLogMessage(error),
    });
    if (isNewCollaborationEmail) {
      console.error("[notifications] Resend send failure.", {
        event,
        recipientEmailExists: true,
        error: sanitizeLogMessage(error),
      });
    }
  }
}

async function safeNotify(event: NotificationEvent, work: () => Promise<void>) {
  try {
    await work();
  } catch (error) {
    console.error("[notifications] Notification failed before email send.", {
      event,
      error: errorMessage(error),
    });
  }
}

export const notificationService = {
  async notifyNewCollaboration({
    collaboration,
    creatorUser,
  }: {
    collaboration: CollaborationLike;
    creatorUser?: NotificationUser | null;
  }) {
    const event: NotificationEvent = "new_collaboration";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration, creatorUser);
      const brand = await resolveBrandUser(collaboration);
      const companyName = trimText(collaboration.companyName, "A brand");
      const href = collaborationHref(collaboration);

      console.info("[notifications] notifyNewCollaboration called", {
        recipientEmailExists: Boolean(creator?.email),
        ...emailConfigLogSnapshot(),
      });

      await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "New collaboration request",
        message: `${companyName} sent you a new collaboration request.`,
        href,
      });

      await sendAndRecord({
        recipient: creator?.email,
        event,
        subject: `New collaboration request from ${companyName}`,
        react: createElement(NewCollaborationEmail, {
          creatorName: userDisplayName(creator, "Creator"),
          companyName,
          campaignGoal: trimText(collaboration.campaignGoal, "New campaign collaboration"),
          budgetRange: trimText(collaboration.budgetRange, "Not specified"),
          timeline: trimText(collaboration.timeline, "Not specified"),
          collaborationUrl: appUrl(href),
        }),
      });
    });
  },

  async notifyCreatorAccepted({
    collaboration,
    creatorUser,
    note,
  }: {
    collaboration: CollaborationLike;
    creatorUser?: NotificationUser | null;
    note?: string;
  }) {
    const event: NotificationEvent = "creator_accepted";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration, creatorUser);
      const brand = await resolveBrandUser(collaboration);
      const companyName = trimText(collaboration.companyName, "your company");
      const creatorName = userDisplayName(creator, trimText(collaboration.creatorUsername, "The creator"));
      const href = collaborationHref(collaboration);

      await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Creator accepted",
        message: `${creatorName} accepted the collaboration request for ${companyName}.`,
        href,
      });

      await sendAndRecord({
        recipient: collaboration.email,
        event,
        subject: `${creatorName} accepted your collaboration request`,
        react: createElement(CreatorAcceptedEmail, {
          brandContactName: trimText(collaboration.contactName, "there"),
          creatorName,
          companyName,
          note: trimText(note),
          collaborationUrl: appUrl(href),
        }),
      });
    });
  },

  async notifyCreatorDeclined({
    collaboration,
    creatorUser,
    note,
  }: {
    collaboration: CollaborationLike;
    creatorUser?: NotificationUser | null;
    note?: string;
  }) {
    const event: NotificationEvent = "creator_declined";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration, creatorUser);
      const brand = await resolveBrandUser(collaboration);
      const companyName = trimText(collaboration.companyName, "your company");
      const creatorName = userDisplayName(creator, trimText(collaboration.creatorUsername, "The creator"));
      const href = collaborationHref(collaboration);

      await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Creator declined",
        message: `${creatorName} declined the collaboration request for ${companyName}.`,
        href,
      });

      await sendAndRecord({
        recipient: collaboration.email,
        event,
        subject: `${creatorName} declined your collaboration request`,
        react: createElement(CreatorDeclinedEmail, {
          brandContactName: trimText(collaboration.contactName, "there"),
          creatorName,
          companyName,
          note: trimText(note),
          collaborationUrl: appUrl(href),
        }),
      });
    });
  },

  async notifyCreatorCounterRequested({
    collaboration,
    creatorUser,
    amount,
    note,
  }: {
    collaboration: CollaborationLike;
    creatorUser?: NotificationUser | null;
    amount?: number;
    note?: string;
  }) {
    const event: NotificationEvent = "counter_requested";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration, creatorUser);
      const brand = await resolveBrandUser(collaboration);
      const companyName = trimText(collaboration.companyName, "your company");
      const creatorName = userDisplayName(creator, trimText(collaboration.creatorUsername, "The creator"));
      const href = collaborationHref(collaboration);
      const noteText = trimText(note);

      await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Counter offer requested",
        message: `${creatorName} requested a revised offer${amountLabel(amount)} for ${companyName}.${noteText ? ` ${noteText}` : ""}`,
        href,
      });
    });
  },

  async notifyBrandNegotiationResponse({
    collaboration,
    action,
    amount,
    note,
  }: {
    collaboration: CollaborationLike;
    action: "accept_counter" | "send_revised_offer" | "decline_negotiation";
    amount?: number;
    note?: string;
  }) {
    const event: NotificationEvent = action === "send_revised_offer" ? "counter_sent" : "brand_response";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration);
      const brand = await resolveBrandUser(collaboration);
      const companyName = trimText(collaboration.companyName, "The brand");
      const href = collaborationHref(collaboration);
      const noteText = trimText(note);
      const title =
        action === "accept_counter"
          ? "Counter offer accepted"
          : action === "send_revised_offer"
            ? "Revised offer sent"
            : "Negotiation declined";
      const actionCopy =
        action === "accept_counter"
          ? `accepted your counter offer${amountLabel(amount)}`
          : action === "send_revised_offer"
            ? `sent a revised offer${amountLabel(amount)}`
            : "declined the negotiation";

      await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title,
        message: `${companyName} ${actionCopy}.${noteText ? ` ${noteText}` : ""}`,
        href,
      });
    });
  },

  async notifyProofSubmitted({ collaboration }: { collaboration: CollaborationLike }) {
    const event: NotificationEvent = "proof_submitted";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration);
      const brand = await resolveBrandUser(collaboration);
      const proof = collaboration.deliveryProof;
      const companyName = trimText(collaboration.companyName, "your company");
      const creatorName = userDisplayName(creator, trimText(collaboration.creatorUsername, "The creator"));
      const href = collaborationHref(collaboration);

      await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Proof submitted",
        message: `${creatorName} submitted delivery proof for ${companyName}.`,
        href,
      });

      await sendAndRecord({
        recipient: collaboration.email,
        event,
        subject: `${creatorName} submitted delivery proof`,
        react: createElement(ProofSubmittedEmail, {
          brandContactName: trimText(collaboration.contactName, "there"),
          creatorName,
          companyName,
          proofUrl: trimText(proof?.referenceLink, trimText(proof?.videoUrl, trimText(proof?.screenshotUrl))),
          notes: trimText(proof?.notes),
          collaborationUrl: appUrl(href),
        }),
      });
    });
  },

  async notifyDeliveryApproved({ collaboration, note }: { collaboration: CollaborationLike; note?: string }) {
    const event: NotificationEvent = "delivery_approved";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration);
      const brand = await resolveBrandUser(collaboration);
      const companyName = trimText(collaboration.companyName, "The brand");
      const href = collaborationHref(collaboration);

      await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "Delivery approved",
        message: `${companyName} approved your delivery proof.`,
        href,
      });

      await sendAndRecord({
        recipient: creator?.email,
        event,
        subject: `${companyName} approved your delivery`,
        react: createElement(DeliveryApprovedEmail, {
          creatorName: userDisplayName(creator, "Creator"),
          companyName,
          note: trimText(note),
          collaborationUrl: appUrl(href),
        }),
      });
    });
  },

  async notifyDeliveryChangesRequested({ collaboration, note }: { collaboration: CollaborationLike; note?: string }) {
    const event: NotificationEvent = "delivery_changes_requested";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration);
      const brand = await resolveBrandUser(collaboration);
      const companyName = trimText(collaboration.companyName, "The brand");
      const href = collaborationHref(collaboration);

      await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "Changes requested",
        message: `${companyName} requested changes to your delivery proof.${trimText(note) ? ` ${trimText(note)}` : ""}`,
        href,
      });

      await sendAndRecord({
        recipient: creator?.email,
        event,
        subject: `${companyName} requested revisions`,
        react: createElement(DeliveryChangesRequestedEmail, {
          creatorName: userDisplayName(creator, "Creator"),
          companyName,
          note: trimText(note),
          collaborationUrl: appUrl(href),
        }),
      });
    });
  },

  async notifyCollaborationCompleted({ collaboration, note }: { collaboration: CollaborationLike; note?: string }) {
    const event: NotificationEvent = "collaboration_completed";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration);
      const brand = await resolveBrandUser(collaboration);
      const companyName = trimText(collaboration.companyName, "The brand");
      const href = collaborationHref(collaboration);

      await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "Collaboration completed",
        message: `${companyName} marked the collaboration complete. It is now in Working History.`,
        href,
      });

      await sendAndRecord({
        recipient: creator?.email,
        event,
        subject: `${companyName} completed the collaboration`,
        react: createElement(CollaborationCompletedEmail, {
          creatorName: userDisplayName(creator, "Creator"),
          companyName,
          note: trimText(note),
          collaborationUrl: appUrl(href),
        }),
      });
    });
  },

  async notifyVerificationApproved({ user, accountType, note, statusLabel }: VerificationNotificationInput) {
    const event: NotificationEvent = "verification_approved";
    await safeNotify(event, async () => {
      await createInAppNotification({
        recipientUserId: userObjectId(user),
        event,
        title: "Verification approved",
        message: `Your ${accountType} verification was approved.`,
        href: accountType === "creator" ? "/dashboard/creator" : "/dashboard/brand",
      });

      await sendAndRecord({
        recipient: user.email,
        event,
        subject: `Your ${accountType} verification was approved`,
        react: createElement(VerificationApprovedEmail, {
          name: userDisplayName(user),
          accountType,
          statusLabel: statusLabel || `${accountType} verified`,
          note: trimText(note),
          verificationUrl: verificationUrl(accountType),
        }),
      });
    });
  },

  async notifyVerificationRejected({ user, accountType, note }: Omit<VerificationNotificationInput, "statusLabel">) {
    const event: NotificationEvent = "verification_rejected";
    await safeNotify(event, async () => {
      await createInAppNotification({
        recipientUserId: userObjectId(user),
        event,
        title: "Verification rejected",
        message: `Your ${accountType} verification was not approved.${trimText(note) ? ` ${trimText(note)}` : ""}`,
        href: accountType === "creator" ? "/dashboard/creator" : "/dashboard/brand",
      });

      await sendAndRecord({
        recipient: user.email,
        event,
        subject: `Your ${accountType} verification needs review`,
        react: createElement(VerificationRejectedEmail, {
          name: userDisplayName(user),
          accountType,
          note: trimText(note),
          verificationUrl: verificationUrl(accountType),
        }),
      });
    });
  },
};
