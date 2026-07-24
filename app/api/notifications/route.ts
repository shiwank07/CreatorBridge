import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { mapNotification, unreadNotificationFilter } from "@/lib/queries/notifications";

import { resolveNotificationRequestUser } from "./_access";

export async function GET(req: Request) {
  try {
    const access = await resolveNotificationRequestUser();
    if (access.response) return access.response;

    const url = new URL(req.url);
    const pageSize = Math.min(50, Math.max(1, Math.trunc(Number(url.searchParams.get("limit") ?? 20) || 20)));
    const page = Math.max(1, Math.trunc(Number(url.searchParams.get("page") ?? 1) || 1));
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type")?.trim().slice(0, 80);
    const query: Record<string, unknown> = { recipientUserId: access.user.id };
    if (status === "unread") Object.assign(query, unreadNotificationFilter(access.user.id));
    if (status === "read") query.isRead = true;
    if (type) query.event = type;

    const [docs, total, unreadCount] = await Promise.all([
      InAppNotification.find(query)
        .select("event type entityType title message href actionUrl isRead readAt createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      InAppNotification.countDocuments(query),
      InAppNotification.countDocuments(unreadNotificationFilter(access.user.id)),
    ]);

    return NextResponse.json({
      notifications: docs.map((doc) => mapNotification(doc)),
      unreadCount,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    return handleRouteError(error, "Notifications fetch failed", "Could not load notifications.");
  }
}
