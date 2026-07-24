import { createElement, type ReactElement } from "react";
import mongoose from "mongoose";
import { createHash } from "node:crypto";

import CreatorAcceptedEmail from "@/emails/creator-accepted";
import CreatorDeclinedEmail from "@/emails/creator-declined";
import CollaborationCompletedEmail from "@/emails/collaboration-completed";
import DeliveryApprovedEmail from "@/emails/delivery-approved";
import DeliveryChangesRequestedEmail from "@/emails/delivery-changes-requested";
import NewCollaborationEmail from "@/emails/new-collaboration";
import ProofSubmittedEmail from "@/emails/proof-submitted";
import VerificationApprovedEmail from "@/emails/verification-approved";
import VerificationRejectedEmail from "@/emails/verification-rejected";
import VerificationSubmittedEmail from "@/emails/verification-submitted";
import { collaborationDetailsHref } from "@/lib/collaboration-routes";
import { sendEmail } from "@/lib/email/email-service";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { EmailNotification, type EmailNotificationStatus } from "@/lib/models/EmailNotification";
import { User } from "@/lib/models/User";
import { notificationEntityForEvent, safeNotificationActionUrl } from "@/lib/notifications/notification-safety";

export type NotificationEvent =
  | "collaboration_request"
  | "new_collaboration"
  | "offer_viewed"
  | "brand_response"
  | "counter_requested"
  | "counter_sent"
  | "counter_offer"
  | "counter_accepted"
  | "counter_rejected"
  | "collaboration_cancelled"
  | "campaign_ready"
  | "creator_accepted"
  | "creator_declined"
  | "proof_submitted"
  | "delivery_approved"
  | "delivery_changes_requested"
  | "collaboration_completed"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected"
  | "chat_message"
  | "featured_creator"
  | "admin_notice"
  | "system_update";

type NotificationUser = {
  _id?: unknown;
  id?: string | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  clerkId?: string | null;
  role?: string | null;
};

type DeliveryProofLike = {
  videoUrl?: string;
  timestampStart?: string;
  timestampEnd?: string;
  notes?: string;
  screenshotUrl?: string;
  referenceLink?: string;
  submittedAt?: Date | null;
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
  revisionCount?: number;
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
  entityType?: "collaboration" | "verification" | "message" | "creator" | "brand" | "system";
  entityId?: string;
  deduplicationKey?: string;
  metadata?: Record<string, unknown>;
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

function toObjectId(value: unknown) {
  if (!value) return null;

  const raw = typeof value === "string" ? value : value.toString();
  return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null;
}

async function resolveCreatorUser(collaboration: CollaborationLike, provided?: NotificationUser | null) {
  if (provided?.email) return provided;

  if (collaboration.creatorUserId) {
    const user = await User.findById(collaboration.creatorUserId).select("email name username clerkId role").exec();
    if (user?.email) return user;
  }

  const username = trimText(collaboration.creatorUsername);
  if (!username) return null;

  return User.findOne({ username, role: "creator" }).select("email name username clerkId role").exec();
}

async function resolveBrandUser(collaboration: CollaborationLike, provided?: NotificationUser | null) {
  if (provided?.email) return provided;

  if (collaboration.brandUserId) {
    const user = await User.findById(collaboration.brandUserId).select("email name username clerkId role").exec();
    if (user?.email) return user;
  }

  if (collaboration.createdByClerkId) {
    const user = await User.findOne({ clerkId: collaboration.createdByClerkId }).select("email name username clerkId role").exec();
    if (user?.email) return user;
  }

  const email = normalizeRecipient(collaboration.email);
  if (!email) return null;

  return User.findOne({ email }).select("email name username clerkId role").exec();
}

async function createInAppNotification(input: InAppNotificationInput) {
  const { recipientUserId, actorUserId, event, title, message } = input;
  const recipientId = toObjectId(recipientUserId);
  const actorId = toObjectId(actorUserId);
  if (!recipientId) return;
  const [recipient, actor] = await Promise.all([
    User.findById(recipientId).select("clerkId role").lean(),
    actorId ? User.findById(actorId).select("clerkId").lean() : Promise.resolve(null),
  ]);
  if (!recipient || !["creator", "brand", "admin"].includes(recipient.role)) return;
  const href = safeNotificationActionUrl(input.href);
  const entityType = input.entityType ?? notificationEntityForEvent(event);
  const entityId = input.entityId ?? href.match(/\/(?:collaborations|verification)\/([^/?#]+)/)?.[1] ?? "";
  const deduplicationKey =
    input.deduplicationKey ??
    `notification:${createHash("sha256").update([recipient.clerkId, event, href, title, message].join("|")).digest("hex")}`;

  try {
    const result = await InAppNotification.updateOne(
      { deduplicationKey },
      {
        $setOnInsert: {
          recipientUserId: recipientId,
          recipientClerkUserId: recipient.clerkId,
          recipientRole: recipient.role,
          actorUserId: actorId,
          actorClerkUserId: actor?.clerkId ?? "",
          event,
          type: event,
          entityType,
          entityId,
          title,
          message,
          href,
          actionUrl: href,
          deduplicationKey,
          metadata: input.metadata ?? {},
          isRead: false,
          readAt: null,
        },
      },
      { upsert: true },
    );
    return result.upsertedCount === 1;
  } catch (error) {
    console.error("[notifications] Could not store in-app notification.", {
      event,
      recipientUserId: String(recipientId),
      error: errorMessage(error),
    });
    return false;
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
  async notifyCounterDecision({
    collaboration,
    accepted,
  }: {
    collaboration: CollaborationLike;
    accepted: boolean;
  }) {
    const event: NotificationEvent = accepted ? "counter_accepted" : "counter_rejected";
    await safeNotify(event, async () => {
      const [creator, brand] = await Promise.all([resolveCreatorUser(collaboration), resolveBrandUser(collaboration)]);
      const companyName = trimText(collaboration.companyName, "The brand");
      await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: accepted ? "Counter offer accepted" : "Counter offer rejected",
        message: accepted
          ? `${companyName} accepted your counter offer. The collaboration is ready to begin.`
          : `${companyName} declined your counter offer.`,
        href: collaborationHref(collaboration),
        deduplicationKey: `collaboration:${collaborationId(collaboration)}:${event}`,
      });
    });
  },

  async notifyCollaborationCancelled({ collaboration }: { collaboration: CollaborationLike }) {
    const event: NotificationEvent = "collaboration_cancelled";
    await safeNotify(event, async () => {
      const [creator, brand] = await Promise.all([resolveCreatorUser(collaboration), resolveBrandUser(collaboration)]);
      await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "Collaboration cancelled",
        message: `${trimText(collaboration.companyName, "The brand")} cancelled the collaboration request.`,
        href: collaborationHref(collaboration),
        deduplicationKey: `collaboration:${collaborationId(collaboration)}:cancelled`,
      });
    });
  },

  async notifyCampaignReady({ collaboration }: { collaboration: CollaborationLike }) {
    const event: NotificationEvent = "campaign_ready";
    await safeNotify(event, async () => {
      const [creator, brand] = await Promise.all([resolveCreatorUser(collaboration), resolveBrandUser(collaboration)]);
      await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Campaign work started",
        message: `${userDisplayName(creator, "The creator")} marked the campaign as in progress.`,
        href: collaborationHref(collaboration),
        deduplicationKey: `collaboration:${collaborationId(collaboration)}:campaign-ready`,
      });
    });
  },

  async notifyChatMessage({
    collaboration,
    messageId,
    senderUserId,
    recipientUserId,
    preview,
  }: {
    collaboration: CollaborationLike;
    messageId: unknown;
    senderUserId: unknown;
    recipientUserId: unknown;
    preview: string;
  }) {
    const event: NotificationEvent = "chat_message";
    await safeNotify(event, async () => {
      const [sender, recipient] = await Promise.all([
        User.findById(senderUserId).select("_id name username clerkId role").lean(),
        User.findById(recipientUserId).select("_id name username clerkId role").lean(),
      ]);
      if (!sender || !recipient) return;
      const id = collaborationId(collaboration);
      await createInAppNotification({
        recipientUserId: recipient._id,
        actorUserId: sender._id,
        event,
        title: `New message from ${userDisplayName(sender, "your collaboration partner")}`,
        message: truncate(trimText(preview, "Sent a collaboration message."), 160),
        href: `${collaborationDetailsHref(id || null)}#chat`,
        entityType: "message",
        entityId: String(messageId),
        deduplicationKey: `message:${String(messageId)}:recipient:${String(recipient._id)}`,
        metadata: { collaborationId: id },
      });
    });
  },

  async notifyOfferViewed({ collaboration }: { collaboration: CollaborationLike }) {
    const event: NotificationEvent = "offer_viewed";
    await safeNotify(event, async () => {
      const [creator, brand] = await Promise.all([resolveCreatorUser(collaboration), resolveBrandUser(collaboration)]);
      await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Collaboration offer viewed",
        message: `${userDisplayName(creator, "The creator")} viewed your collaboration offer.`,
        href: collaborationHref(collaboration),
      });
    });
  },

  async notifyCounterOffer({
    collaboration,
    actor,
    amount,
    note,
  }: {
    collaboration: CollaborationLike;
    actor: "brand" | "creator";
    amount: number;
    note?: string;
  }) {
    const event: NotificationEvent = "counter_offer";
    await safeNotify(event, async () => {
      const [creator, brand] = await Promise.all([resolveCreatorUser(collaboration), resolveBrandUser(collaboration)]);
      const recipient = actor === "creator" ? brand : creator;
      const actorUser = actor === "creator" ? creator : brand;
      await createInAppNotification({
        recipientUserId: userObjectId(recipient),
        actorUserId: userObjectId(actorUser),
        event,
        title: "New counter offer",
        message: `${userDisplayName(actorUser, actor)} proposed INR ${amount.toLocaleString("en-IN")}.${trimText(note) ? ` ${trimText(note)}` : ""}`,
        href: collaborationHref(collaboration),
      });
    });
  },

  async notifyVerificationSubmitted({
    user,
    platform,
    profileUrl,
  }: {
    user: NotificationUser;
    platform: string;
    profileUrl: string;
  }) {
    const event: NotificationEvent = "verification_submitted";
    await safeNotify(event, async () => {
      const created = await createInAppNotification({
        recipientUserId: userObjectId(user),
        event,
        title: "Verification request submitted",
        message: "Your creator verification request is queued for admin review.",
        href: "/dashboard/verification",
      });

      const admins = await User.find({ role: "admin", accountStatus: "active" }).select("_id").exec();
      await Promise.all(
        admins.map((admin) =>
          createInAppNotification({
            recipientUserId: admin._id,
            actorUserId: userObjectId(user),
            event,
            title: "New creator verification request",
            message: `${userDisplayName(user, "A creator")} submitted a ${platform} profile for review.`,
            href: "/admin/verification",
          }),
        ),
      );

      if (created) await sendAndRecord({
        recipient: user.email,
        event,
        subject: "Your creator verification request is in review",
        react: createElement(VerificationSubmittedEmail, {
          name: userDisplayName(user),
          platform,
          profileUrl,
          verificationUrl: appUrl("/dashboard/verification"),
        }),
      });
    });
  },

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

      const created = await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "New collaboration request",
        message: `${companyName} sent you a new collaboration request.`,
        href,
      });

      if (created) await sendAndRecord({
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

      const created = await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Creator accepted",
        message: `${creatorName} accepted the collaboration request for ${companyName}.`,
        href,
      });

      if (created) await sendAndRecord({
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

      const created = await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Creator declined",
        message: `${creatorName} declined the collaboration request for ${companyName}.`,
        href,
      });

      if (created) await sendAndRecord({
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

  async notifyProofSubmitted({ collaboration }: { collaboration: CollaborationLike }) {
    const event: NotificationEvent = "proof_submitted";
    await safeNotify(event, async () => {
      const creator = await resolveCreatorUser(collaboration);
      const brand = await resolveBrandUser(collaboration);
      const proof = collaboration.deliveryProof;
      const companyName = trimText(collaboration.companyName, "your company");
      const creatorName = userDisplayName(creator, trimText(collaboration.creatorUsername, "The creator"));
      const href = collaborationHref(collaboration);

      const created = await createInAppNotification({
        recipientUserId: userObjectId(brand),
        actorUserId: userObjectId(creator),
        event,
        title: "Proof submitted",
        message: `${creatorName} submitted delivery proof for ${companyName}.`,
        href,
        deduplicationKey: `collaboration:${collaborationId(collaboration)}:proof:${proof?.submittedAt?.toISOString?.() ?? "initial"}`,
      });

      if (created) await sendAndRecord({
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

      const created = await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "Delivery approved",
        message: `${companyName} approved your delivery proof.`,
        href,
      });

      if (created) await sendAndRecord({
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

      const created = await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "Changes requested",
        message: `${companyName} requested changes to your delivery proof.${trimText(note) ? ` ${trimText(note)}` : ""}`,
        href,
        deduplicationKey: `collaboration:${collaborationId(collaboration)}:revision:${collaboration.revisionCount ?? 0}`,
      });

      if (created) await sendAndRecord({
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

      const created = await createInAppNotification({
        recipientUserId: userObjectId(creator),
        actorUserId: userObjectId(brand),
        event,
        title: "Collaboration completed",
        message: `${companyName} marked the collaboration complete. It is now in Working History.`,
        href,
      });

      if (created) await sendAndRecord({
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
      const created = await createInAppNotification({
        recipientUserId: userObjectId(user),
        event,
        title: "Verification approved",
        message: `Your ${accountType} verification was approved.`,
        href: accountType === "creator" ? "/dashboard/verification" : "/dashboard/brand",
      });

      if (created) await sendAndRecord({
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
      const created = await createInAppNotification({
        recipientUserId: userObjectId(user),
        event,
        title: "Verification rejected",
        message: `Your ${accountType} verification needs review. Open the verification page for details.`,
        href: accountType === "creator" ? "/dashboard/verification" : "/dashboard/brand",
      });

      if (created) await sendAndRecord({
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
