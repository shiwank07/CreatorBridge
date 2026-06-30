import { getCurrentAppUser } from "@/lib/current-user";
import { connectDB, hasMongoUri } from "@/lib/db";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { type InAppNotificationData } from "@/lib/types";

type NotificationDocument = {
  _id: { toString(): string };
  event: string;
  title: string;
  message: string;
  href: string;
  readAt?: Date | null;
  createdAt?: Date;
};

function mapNotification(doc: NotificationDocument): InAppNotificationData {
  return {
    id: doc._id.toString(),
    event: doc.event,
    title: doc.title,
    message: doc.message,
    href: doc.href,
    readAt: doc.readAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString(),
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
  const notifications = await getCurrentUserNotifications(limit);
  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
  };
}
