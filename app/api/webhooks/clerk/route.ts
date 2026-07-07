import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { handleRouteError } from "@/lib/api-errors";
import { getClerkEmailVerificationState } from "@/lib/clerk-verification";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { ensureUniqueUsername } from "@/lib/queries/creators";

function getPrimaryEmail(data: WebhookEvent["data"]) {
  if (!("email_addresses" in data)) return "";
  const primary = data.email_addresses.find((email) => email.id === data.primary_email_address_id);
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? "";
}

function getDisplayName(data: WebhookEvent["data"], email: string) {
  if (!("first_name" in data)) return email.split("@")[0] ?? "Creator";
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return fullName || data.username || email.split("@")[0] || "Creator";
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
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

    await connectDB();

    if (event.type === "user.created" || event.type === "user.updated") {
      const email = getPrimaryEmail(event.data);
      const emailVerified = Boolean(getClerkEmailVerificationState(event.data, email)?.verified);
      const name = getDisplayName(event.data, email);
      const usernameSeed = "username" in event.data && event.data.username ? event.data.username : name;
      const username = await ensureUniqueUsername(usernameSeed, event.data.id);

      await User.findOneAndUpdate(
        { clerkId: event.data.id },
        {
          $set: {
            email,
            emailVerified,
            name,
            avatar: "image_url" in event.data ? event.data.image_url ?? "" : "",
          },
          $setOnInsert: {
            username,
            role: "creator",
            onboardingComplete: false,
            subscriptionTier: "free",
            isFeatured: false,
            isVerified: false,
          },
        },
        { upsert: true, new: true },
      );
    }

    if (event.type === "user.deleted" && event.data.id) {
      const deletedUser = await User.findOneAndDelete({ clerkId: event.data.id });
      if (deletedUser) {
        await Promise.all([
          CreatorProfile.deleteOne({ userId: deletedUser._id }),
          BrandProfile.deleteOne({ userId: deletedUser._id }),
        ]);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Clerk webhook failed", "Could not process Clerk webhook.");
  }
}
