import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { unreadNotificationFilter } from "@/lib/queries/notifications";

import { resolveNotificationRequestUser } from "../_access";

export async function PATCH() {
  try {
    const access = await resolveNotificationRequestUser();
    if (access.response) return access.response;

    const now = new Date();
    const result = await InAppNotification.updateMany(unreadNotificationFilter(access.user.id), {
      $set: {
        isRead: true,
        readAt: now,
      },
    }).exec();

    return NextResponse.json({
      ok: true,
      updatedCount: result.modifiedCount,
      unreadCount: 0,
      readAt: now.toISOString(),
    });
  } catch (error) {
    return handleRouteError(error, "Notifications read-all update failed", "Could not mark notifications as read.");
  }
}
