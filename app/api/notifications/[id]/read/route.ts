import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { mapNotification, unreadNotificationFilter } from "@/lib/queries/notifications";

import { resolveNotificationRequestUser } from "../../_access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const access = await resolveNotificationRequestUser();
    if (access.response) return access.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid notification id." }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as { isRead?: unknown } | null;
    const shouldRead = body?.isRead !== false;
    const now = new Date();
    const notification = await InAppNotification.findOneAndUpdate(
      { _id: id, recipientUserId: access.user.id },
      {
        $set: {
          isRead: shouldRead,
          readAt: shouldRead ? now : null,
        },
      },
      { returnDocument: "after" },
    ).exec();

    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const unreadCount = await InAppNotification.countDocuments(unreadNotificationFilter(access.user.id)).exec();

    return NextResponse.json({
      notification: mapNotification(notification),
      unreadCount,
    });
  } catch (error) {
    return handleRouteError(error, "Notification read update failed", "Could not mark notification as read.");
  }
}
