import type { WebhookEvent } from "@clerk/nextjs/server";
import type mongoose from "mongoose";

import { anonymizeDeletedAccount } from "@/lib/account-deletion";
import { getClerkEmailVerificationState } from "@/lib/clerk-verification";
import { ClerkWebhookEvent } from "@/lib/models/ClerkWebhookEvent";
import { User } from "@/lib/models/User";
import { ensureUniqueUsername } from "@/lib/queries/creators";

type ClerkUserEvent = Extract<WebhookEvent, { type: "user.created" | "user.updated" | "user.deleted" }>;

function primaryEmail(data: ClerkUserEvent["data"]) {
  if (!("email_addresses" in data)) return "";
  const primary = data.email_addresses.find((email) => email.id === data.primary_email_address_id);
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? "";
}

function displayName(data: ClerkUserEvent["data"], email: string) {
  if (!("first_name" in data)) return email.split("@")[0] || "Branzzo user";
  return [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || data.username || email.split("@")[0] || "Branzzo user";
}

export function trustedClerkEventTimestamp(event: ClerkUserEvent, signedTimestamp: string) {
  const updatedAt = "updated_at" in event.data && typeof event.data.updated_at === "number" ? event.data.updated_at : 0;
  const fallback = Number(signedTimestamp) * 1000;
  const milliseconds = updatedAt > 0 ? updatedAt : fallback;
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error("Clerk event timestamp is invalid.");
  return new Date(milliseconds);
}

export async function claimClerkWebhookEvent(input: {
  eventId: string; eventType: string; clerkUserId?: string; eventTimestamp: Date;
}) {
  const now = new Date();
  try {
    const created = await ClerkWebhookEvent.create({
      ...input, receivedAt: now, status: "processing", attempts: 1,
    });
    return { claimed: true as const, record: created };
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
  }
  const retry = await ClerkWebhookEvent.findOneAndUpdate(
    {
      eventId: input.eventId, attempts: { $lt: 5 },
      $or: [
        { status: "failed" },
        { status: "processing", updatedAt: { $lt: new Date(now.getTime() - 10 * 60_000) } },
      ],
    },
    { $set: { status: "processing", error: null, receivedAt: now }, $inc: { attempts: 1 } },
    { new: true },
  );
  if (retry) return { claimed: true as const, record: retry };
  return { claimed: false as const, record: await ClerkWebhookEvent.findOne({ eventId: input.eventId }) };
}

export async function finishClerkWebhookEvent(id: mongoose.Types.ObjectId, status: "processed" | "skipped") {
  await ClerkWebhookEvent.updateOne({ _id: id, status: "processing" }, { $set: { status, processedAt: new Date(), error: null } });
}

export async function failClerkWebhookEvent(id: mongoose.Types.ObjectId) {
  await ClerkWebhookEvent.updateOne(
    { _id: id, status: "processing" },
    { $set: { status: "failed", processedAt: null, error: "Clerk user synchronization failed." } },
  );
}

export async function applyClerkUserEvent(event: ClerkUserEvent, eventId: string, eventTimestamp: Date) {
  const clerkUserId = event.data.id;
  if (!clerkUserId) return "skipped" as const;
  if (event.type === "user.deleted") {
    const result = await anonymizeDeletedAccount({
      clerkUserId, deletedAt: eventTimestamp, eventId, eventTimestamp, source: "clerk_webhook",
    });
    return result.outcome === "stale" ? "skipped" as const : "processed" as const;
  }

  const existing = await User.findOne({ clerkId: clerkUserId }).select("_id deletedAt latestClerkEventAt latestClerkEventId").lean();
  if (existing?.deletedAt) return "skipped" as const;
  if (existing?.latestClerkEventAt && (
    existing.latestClerkEventAt > eventTimestamp ||
    (existing.latestClerkEventAt.getTime() === eventTimestamp.getTime() && existing.latestClerkEventId !== eventId)
  )) return "skipped" as const;

  const email = primaryEmail(event.data);
  if (!email) throw new Error("Clerk user has no email address.");
  const name = displayName(event.data, email);
  const usernameSeed = "username" in event.data && event.data.username ? event.data.username : name;
  const username = await ensureUniqueUsername(usernameSeed, clerkUserId);
  const emailVerified = Boolean(getClerkEmailVerificationState(event.data, email)?.verified);
  const ordering = {
    deletedAt: null,
    $or: [
      { latestClerkEventAt: { $lt: eventTimestamp } },
      { latestClerkEventAt: null },
      { latestClerkEventAt: { $exists: false } },
      { latestClerkEventAt: eventTimestamp, latestClerkEventId: eventId },
    ],
  };
  const updated = await User.findOneAndUpdate(
    { clerkId: clerkUserId, ...ordering },
    { $set: {
      email, emailVerified, name, avatar: "image_url" in event.data ? event.data.image_url ?? "" : "",
      latestClerkEventAt: eventTimestamp, latestClerkEventId: eventId,
    } },
    { new: true },
  );
  if (updated) return "processed" as const;

  if (await User.exists({ clerkId: clerkUserId })) return "skipped" as const;
  try {
    await User.create({
      clerkId: clerkUserId, email, emailVerified, name, username,
      avatar: "image_url" in event.data ? event.data.image_url ?? "" : "",
      role: "creator", onboardingComplete: false, subscriptionTier: "free",
      isFeatured: false, isVerified: false, latestClerkEventAt: eventTimestamp, latestClerkEventId: eventId,
    });
    return "processed" as const;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return "skipped" as const;
    throw error;
  }
}
