import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { handleRouteError } from "@/lib/api-errors";
import {
  applyClerkUserEvent, claimClerkWebhookEvent, failClerkWebhookEvent,
  finishClerkWebhookEvent, trustedClerkEventTimestamp,
} from "@/lib/clerk-user-sync";
import { hasMongoUri, modelForConnection, withMongoRequest } from "@/lib/db";
import { ClerkWebhookEvent } from "@/lib/models/ClerkWebhookEvent";
import { User } from "@/lib/models/User";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { EmailNotification } from "@/lib/models/EmailNotification";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { SavedCreator } from "@/lib/models/SavedCreator";

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET is not configured." }, { status: 500 });
    }

    const headerPayload = await headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing Svix headers." }, { status: 400 });
    }

    const payload = await req.text();
    const webhook = new Webhook(webhookSecret);

    let event: WebhookEvent;
    try {
      event = webhook.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    if (!["user.created", "user.updated", "user.deleted"].includes(event.type)) {
      return NextResponse.json({ ok: true });
    }
    return await withMongoRequest("clerk-webhook", async (connection) => {
      const models = {
        UserModel: modelForConnection(connection, User),
        EventModel: modelForConnection(connection, ClerkWebhookEvent),
        deletionModels: {
          UserModel: modelForConnection(connection, User),
          CreatorProfileModel: modelForConnection(connection, CreatorProfile),
          BrandProfileModel: modelForConnection(connection, BrandProfile),
          CreatorVerificationRequestModel: modelForConnection(connection, CreatorVerificationRequest),
          SavedCreatorModel: modelForConnection(connection, SavedCreator),
          InAppNotificationModel: modelForConnection(connection, InAppNotification),
          BrandInquiryModel: modelForConnection(connection, BrandInquiry),
          EmailNotificationModel: modelForConnection(connection, EmailNotification),
        },
      };
      const userEvent = event as Extract<WebhookEvent, { type: "user.created" | "user.updated" | "user.deleted" }>;
      const eventTimestamp = trustedClerkEventTimestamp(userEvent, svixTimestamp);
      const claim = await claimClerkWebhookEvent({
        eventId: svixId, eventType: event.type, clerkUserId: event.data.id, eventTimestamp,
      }, models);
      if (!claim.claimed || !claim.record) return NextResponse.json({ ok: true });
      try {
        const outcome = await applyClerkUserEvent(userEvent, svixId, eventTimestamp, models);
        await finishClerkWebhookEvent(claim.record._id, outcome, models);
        return NextResponse.json({ ok: true });
      } catch (error) {
        await failClerkWebhookEvent(claim.record._id, models);
        throw error;
      }
    });
  } catch (error) {
    return handleRouteError(error, "Clerk webhook failed", "Could not process Clerk webhook.");
  }
}
