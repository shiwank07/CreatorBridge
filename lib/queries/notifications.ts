import { getCurrentAppUser } from "@/lib/current-user";
import { notificationTargetHref } from "@/lib/collaboration-routes";
import { connectDB, hasMongoUri, MONGO_QUERY_TIMEOUT_MS } from "@/lib/db";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { type InAppNotificationData } from "@/lib/types";
import { safeNotificationActionUrl } from "@/lib/notifications/notification-safety";

type NotificationDocument = {
  _id: { toString(): string };
  event: string;
  title: string;
  message: string;
  href: string;
  actionUrl?: string;
  type?: string;
  entityType?: string;
  isRead?: boolean;
  readAt?: Date | null;
  createdAt?: Date;
};

export function mapNotification(doc: NotificationDocument): InAppNotificationData {
  const readAt = doc.readAt?.toISOString();

  return {
    id: doc._id.toString(),
    event: doc.event,
    title: doc.title,
    message: doc.message,
    href: notificationTargetHref(doc.event, safeNotificationActionUrl(doc.actionUrl || doc.href)),
    type: doc.type || doc.event,
    entityType: doc.entityType,
    isRead: typeof doc.isRead === "boolean" ? doc.isRead : Boolean(readAt),
    readAt: readAt ?? null,
    createdAt: doc.createdAt?.toISOString(),
  };
}

export type NotificationPageFilters = {
  status?: "all" | "unread" | "read";
  type?: string;
  page?: number;
  pageSize?: number;
};

export async function getCurrentUserNotificationPage(filters: NotificationPageFilters = {}) {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Math.trunc(filters.pageSize ?? 30)));
  if (!hasMongoUri()) return { notifications: [], total: 0, page, pageSize, totalPages: 1, unreadCount: 0 };
  const user = await getCurrentAppUser();
  if (!user?.onboardingComplete) return { notifications: [], total: 0, page, pageSize, totalPages: 1, unreadCount: 0 };
  await connectDB();
  const query: Record<string, unknown> = { recipientUserId: user.id };
  if (filters.status === "unread") Object.assign(query, unreadNotificationFilter(user.id));
  if (filters.status === "read") query.isRead = true;
  if (filters.type) query.event = filters.type;
  const [docs, total, unreadCount] = await Promise.all([
    InAppNotification.find(query)
      .select("event type entityType title message href actionUrl isRead readAt createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    InAppNotification.countDocuments(query),
    InAppNotification.countDocuments(unreadNotificationFilter(user.id)),
  ]);
  return {
    notifications: docs.map((doc) => mapNotification(doc as unknown as NotificationDocument)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    unreadCount,
  };
}

export function unreadNotificationFilter(recipientUserId: string) {
  return {
    recipientUserId,
    $or: [
      { isRead: false },
      {
        isRead: { $exists: false },
        readAt: null,
      },
    ],
  };
}

export async function getCurrentUserNotifications(limit = 50): Promise<InAppNotificationData[]> {
  if (!hasMongoUri()) return [];

  const user = await getCurrentAppUser();
  if (!user?.onboardingComplete) return [];

  await connectDB();
  const docs = await InAppNotification.find({ recipientUserId: user.id }).sort({ createdAt: -1 }).limit(limit).exec();
  return docs.map((doc) => mapNotification(doc as unknown as NotificationDocument));
}

export async function getCurrentUserNotificationSummary(limit = 5) {
  if (!hasMongoUri()) {
    return {
      notifications: [],
      unreadCount: 0,
    };
  }

  const user = await getCurrentAppUser();
  if (!user?.onboardingComplete) {
    return {
      notifications: [],
      unreadCount: 0,
    };
  }

  await connectDB();
  const [docs, unreadCount] = await Promise.all([
    InAppNotification.find({ recipientUserId: user.id })
      .select("event type entityType title message href actionUrl isRead readAt createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .maxTimeMS(MONGO_QUERY_TIMEOUT_MS)
      .lean()
      .exec(),
    InAppNotification.countDocuments(unreadNotificationFilter(user.id)).maxTimeMS(MONGO_QUERY_TIMEOUT_MS).exec(),
  ]);

  return {
    notifications: docs.map((doc) => mapNotification(doc as unknown as NotificationDocument)),
    unreadCount,
  };
}
