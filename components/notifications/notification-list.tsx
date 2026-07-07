"use client";

import { type MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import { notificationTargetHref } from "@/lib/collaboration-routes";
import { type InAppNotificationData } from "@/lib/types";
import { emitNotificationsUpdated } from "@/components/notifications/notification-events";
import { formatNotificationTime, getNotificationVisual } from "@/components/notifications/notification-visuals";

type NotificationListProps = {
  notifications: InAppNotificationData[];
  compact?: boolean;
};

function applyReadState(notifications: InAppNotificationData[], notificationId: string, readAt: string) {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? {
          ...notification,
          isRead: true,
          readAt,
        }
      : notification,
  );
}

function notificationHref(notification: InAppNotificationData) {
  return notificationTargetHref(notification.event, notification.href);
}

function notificationDisplay(notification: InAppNotificationData) {
  if (notification.event !== "counter_requested" && notification.event !== "counter_sent") return notification;

  return {
    ...notification,
    title: "Collaboration update",
    message: "A collaboration request was updated.",
  };
}

function navigateToNotification(router: ReturnType<typeof useRouter>, notification: InAppNotificationData) {
  const target = notificationHref(notification);

  if (/^https?:\/\//i.test(target)) {
    window.location.assign(target);
    return;
  }

  router.push(target);
}

function NotificationEmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_28px_rgba(103,232,249,0.1)]">
        <Bell size={22} />
      </div>
      <p className="mt-5 font-display text-lg font-bold text-[var(--text-primary)]">No notifications yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        When brands contact you or verification updates happen, they&apos;ll appear here.
      </p>
    </div>
  );
}

export function NotificationList({ notifications, compact = false }: NotificationListProps) {
  const [items, setItems] = useState(notifications);
  const router = useRouter();

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  async function handleNotificationClick(event: MouseEvent<HTMLAnchorElement>, notification: InAppNotificationData) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    event.preventDefault();

    const wasUnread = !notification.isRead;
    const readAt = new Date().toISOString();

    if (wasUnread) {
      setItems((current) => applyReadState(current, notification.id, readAt));
      emitNotificationsUpdated({
        notificationId: notification.id,
        readAt,
      });
    }

    try {
      if (wasUnread) {
        const response = await fetch(`/api/notifications/${notification.id}/read`, {
          method: "PATCH",
        });

        if (response.ok) {
          const data = (await response.json()) as { notification: InAppNotificationData; unreadCount: number };
          setItems((current) => current.map((item) => (item.id === data.notification.id ? data.notification : item)));
          emitNotificationsUpdated({
            notificationId: data.notification.id,
            unreadCount: data.unreadCount,
            readAt: data.notification.readAt ?? undefined,
          });
        }
      }
    } finally {
      navigateToNotification(router, notification);
    }
  }

  if (!items.length) {
    return <NotificationEmptyState />;
  }

  return (
    <div className="grid gap-3">
      <AnimatePresence initial={false}>
        {items.map((notification) => {
          const display = notificationDisplay(notification);
          const visual = getNotificationVisual(notification.event);
          const Icon = visual.Icon;
          const isUnread = !notification.isRead;

          return (
            <motion.a
              key={notification.id}
              href={notificationHref(notification)}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(event) => void handleNotificationClick(event, notification)}
              className={cn(
                "focus-ring relative flex items-start gap-3 overflow-hidden rounded-[8px] border p-4 text-left transition-colors",
                isUnread
                  ? "border-violet-300/20 bg-white/[0.075] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "border-white/10 bg-white/[0.035] hover:border-cyan-300/30 hover:bg-cyan-300/10",
              )}
            >
              <AnimatePresence>
                {isUnread ? (
                  <motion.span
                    initial={{ opacity: 0, scaleY: 0.72 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0.72 }}
                    className="absolute bottom-4 left-0 top-4 w-px rounded-full bg-violet-400"
                  />
                ) : null}
              </AnimatePresence>
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border",
                  visual.shellClassName,
                )}
                aria-hidden="true"
              >
                <Icon size={16} className={visual.iconClassName} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold text-[var(--text-primary)]">{display.title}</span>
                      <AnimatePresence>
                        {isUnread ? (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            className="h-2 w-2 shrink-0 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.72)]"
                          />
                        ) : null}
                      </AnimatePresence>
                    </span>
                    <span className={`${compact ? "line-clamp-2" : ""} mt-1 block text-sm leading-6 text-[var(--text-secondary)]`}>
                      {display.message}
                    </span>
                    <span className="mt-2 block text-xs text-[var(--text-muted)]">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </span>
                  <ExternalLink size={14} className="mt-1 shrink-0 text-[var(--text-muted)]" />
                </span>
              </span>
            </motion.a>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
