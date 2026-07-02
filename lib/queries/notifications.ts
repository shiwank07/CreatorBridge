import { getCurrentAppUser } from "@/lib/current-user";
import { notificationTargetHref } from "@/lib/collaboration-routes";
import { connectDB, hasMongoUri } from "@/lib/db";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { type InAppNotificationData } from "@/lib/types";

type NotificationDocument = {
  _id: { toString(): string };
  event: string;
  title: string;
  message: string;
  href: string;
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
    href: notificationTargetHref(doc.event, doc.href),
    isRead: typeof doc.isRead === "boolean" ? doc.isRead : Boolean(readAt),
    readAt: readAt ?? null,
    createdAt: doc.createdAt?.toISOString(),
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
    InAppNotification.find({ recipientUserId: user.id }).sort({ createdAt: -1 }).limit(limit).exec(),
    InAppNotification.countDocuments(unreadNotificationFilter(user.id)).exec(),
  ]);

  return {
    notifications: docs.map((doc) => mapNotification(doc as unknown as NotificationDocument)),
    unreadCount,
  };
}
