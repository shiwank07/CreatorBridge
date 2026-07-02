import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { mapNotification, unreadNotificationFilter } from "@/lib/queries/notifications";

import { resolveNotificationRequestUser } from "./_access";

function notificationLimit(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get("limit") ?? 20);

  if (!Number.isFinite(rawLimit)) return 20;
  return Math.min(Math.max(Math.trunc(rawLimit), 1), 50);
}

export async function GET(req: Request) {
  try {
    const access = await resolveNotificationRequestUser();
    if (access.response) return access.response;

    const [docs, unreadCount] = await Promise.all([
      InAppNotification.find({ recipientUserId: access.user.id }).sort({ createdAt: -1 }).limit(notificationLimit(req)).exec(),
      InAppNotification.countDocuments(unreadNotificationFilter(access.user.id)).exec(),
    ]);

    return NextResponse.json({
      notifications: docs.map((doc) => mapNotification(doc)),
      unreadCount,
    });
  } catch (error) {
    return handleRouteError(error, "Notifications fetch failed", "Could not load notifications.");
  }
}
