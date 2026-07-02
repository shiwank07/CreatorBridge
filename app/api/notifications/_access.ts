import { NextResponse } from "next/server";

import { hasClerkKeys } from "@/lib/clerk-config";
import { type CurrentAppUser, getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { connectDB, hasMongoUri } from "@/lib/db";

type NotificationRequestUserResult =
  | {
      user: CurrentAppUser;
      response?: never;
    }
  | {
      user?: never;
      response: NextResponse;
    };

export async function resolveNotificationRequestUser(): Promise<NotificationRequestUserResult> {
  if (!hasClerkKeys()) {
    return {
      response: NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 }),
    };
  }

  const clerkUserId = await getCurrentClerkUserId();
  if (!clerkUserId) {
    return {
      response: NextResponse.json({ error: "Sign in before viewing notifications." }, { status: 401 }),
    };
  }

  if (!hasMongoUri()) {
    return {
      response: NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 }),
    };
  }

  const user = await getCurrentAppUser();
  if (!user?.onboardingComplete) {
    return {
      response: NextResponse.json({ error: "Complete onboarding before viewing notifications." }, { status: 403 }),
    };
  }

  if (user.role !== "brand" && user.role !== "creator") {
    return {
      response: NextResponse.json({ error: "Notifications are available for creator and brand accounts." }, { status: 403 }),
    };
  }

  await connectDB();
  return { user };
}
