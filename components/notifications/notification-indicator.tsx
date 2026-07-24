"use client";

import { type MouseEvent, useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { notificationTargetHref } from "@/lib/collaboration-routes";
import { type InAppNotificationData } from "@/lib/types";
import {
  emitNotificationsUpdated,
  NOTIFICATIONS_UPDATED_EVENT,
  type NotificationsUpdatedDetail,
} from "@/components/notifications/notification-events";
import { formatNotificationTime, getNotificationVisual } from "@/components/notifications/notification-visuals";

type NotificationIndicatorProps = {
  initialNotifications: InAppNotificationData[];
  initialUnreadCount: number;
};

type NotificationsResponse = {
  notifications: InAppNotificationData[];
  unreadCount: number;
};

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

function NotificationEmptyState() {
  return (
    <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_34px_rgba(103,232,249,0.12)]">
        <span className="absolute h-24 w-24 rounded-full border border-violet-300/10" />
        <span className="absolute h-32 w-32 rounded-full border border-cyan-300/10" />
        <Bell size={24} />
      </div>
      <p className="mt-6 font-display text-lg font-bold text-[var(--text-primary)]">No notifications yet</p>
      <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--text-secondary)]">
        When brands contact you or verification updates happen, they&apos;ll appear here.
      </p>
    </div>
  );
}

type DropdownNotificationProps = {
  notification: InAppNotificationData;
  onOpen: (notification: InAppNotificationData) => void;
};

function DropdownNotification({ notification, onOpen }: DropdownNotificationProps) {
  const display = notificationDisplay(notification);
  const visual = getNotificationVisual(notification.event);
  const Icon = visual.Icon;
  const isUnread = !notification.isRead;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={() => onOpen(notification)}
      className={cn(
        "focus-ring relative flex w-full items-start gap-3 overflow-hidden rounded-[8px] border p-3 text-left transition-colors",
        isUnread
          ? "border-violet-300/20 bg-white/[0.075] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "border-white/10 bg-white/[0.032] hover:border-cyan-300/24 hover:bg-white/[0.055]",
      )}
    >
      <AnimatePresence>
        {isUnread ? (
          <motion.span
            layoutId={`notification-accent-${notification.id}`}
            initial={{ opacity: 0, scaleY: 0.72 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.72 }}
            className="absolute bottom-3 left-0 top-3 w-px rounded-full bg-violet-400"
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
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{display.title}</span>
            <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{display.message}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-2">
            <span className="whitespace-nowrap text-[11px] font-medium text-[var(--text-muted)]">
              {formatNotificationTime(notification.createdAt)}
            </span>
            <AnimatePresence>
              {isUnread ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.72)]"
                  aria-label="Unread"
                />
              ) : null}
            </AnimatePresence>
          </span>
        </span>
      </span>
    </motion.button>
  );
}

export function NotificationIndicator({ initialNotifications, initialUnreadCount }: NotificationIndicatorProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [canCloseFromOutside, setCanCloseFromOutside] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isFetching, setIsFetching] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [canUsePortal, setCanUsePortal] = useState(false);
  const router = useRouter();
  const panelId = useId();
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  useEffect(() => {
    setCanUsePortal(true);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsFetching(true);

    try {
      const response = await fetch("/api/notifications?limit=12", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as NotificationsResponse;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setIsFetching(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    void refreshNotifications();

    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 45_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshNotifications();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn, refreshNotifications]);

  useEffect(() => {
    if (!isOpen || !isLoaded || !isSignedIn) return;

    void refreshNotifications();
    setCanCloseFromOutside(false);
    const closeFrame = window.requestAnimationFrame(() => {
      setCanCloseFromOutside(true);
    });

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(closeFrame);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoaded, isOpen, isSignedIn, refreshNotifications]);

  useEffect(() => {
    function handleNotificationsUpdated(event: Event) {
      const detail = (event as CustomEvent<NotificationsUpdatedDetail>).detail;
      if (!detail) {
        void refreshNotifications();
        return;
      }

      if (typeof detail.unreadCount === "number") {
        setUnreadCount(detail.unreadCount);
      }

      if (detail.allRead) {
        const readAt = detail.readAt ?? new Date().toISOString();
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt ?? readAt,
          })),
        );
        return;
      }

      if (detail.notificationId) {
        const notificationId = detail.notificationId;
        setNotifications((current) => applyReadState(current, notificationId, detail.readAt ?? new Date().toISOString()));
        if (typeof detail.unreadCount !== "number") {
          setUnreadCount((current) => Math.max(0, current - 1));
        }
      }
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    };
  }, [refreshNotifications]);

  async function handleNotificationOpen(notification: InAppNotificationData) {
    const wasUnread = !notification.isRead;
    const readAt = new Date().toISOString();

    if (wasUnread) {
      const optimisticUnreadCount = Math.max(0, unreadCount - 1);
      setNotifications((current) => applyReadState(current, notification.id, readAt));
      setUnreadCount(optimisticUnreadCount);
      emitNotificationsUpdated({
        notificationId: notification.id,
        unreadCount: optimisticUnreadCount,
        readAt,
      });
    }

    setIsOpen(false);

    try {
      if (wasUnread) {
        const response = await fetch(`/api/notifications/${notification.id}/read`, {
          method: "PATCH",
        });

        if (response.ok) {
          const data = (await response.json()) as { notification: InAppNotificationData; unreadCount: number };
          setNotifications((current) => current.map((item) => (item.id === data.notification.id ? data.notification : item)));
          setUnreadCount(data.unreadCount);
          emitNotificationsUpdated({
            notificationId: data.notification.id,
            unreadCount: data.unreadCount,
            readAt: data.notification.readAt ?? undefined,
          });
        } else {
          void refreshNotifications();
        }
      }
    } finally {
      navigateToNotification(router, notification);
    }
  }

  async function handleMarkAllAsRead() {
    if (!unreadCount || isMarkingAll) return;

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    const readAt = new Date().toISOString();

    setIsMarkingAll(true);
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? readAt,
      })),
    );
    setUnreadCount(0);
    emitNotificationsUpdated({ allRead: true, unreadCount: 0, readAt });

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Could not mark notifications as read.");
      }

      const data = (await response.json()) as { unreadCount: number; readAt: string };
      setUnreadCount(data.unreadCount);
      emitNotificationsUpdated({ allRead: true, unreadCount: data.unreadCount, readAt: data.readAt });
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      emitNotificationsUpdated({ unreadCount: previousUnreadCount });
    } finally {
      setIsMarkingAll(false);
    }
  }

  function openNotifications(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(true);
  }

  function closeFromOutside() {
    if (!canCloseFromOutside) return;
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openNotifications}
        className="focus-ring relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-[var(--text-secondary)] transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-[var(--text-primary)]"
        aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : "Open notifications"}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <Bell size={18} />
        <AnimatePresence>
          {unreadCount > 0 ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.72 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.72 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#070712] bg-red-500 px-1 text-[10px] font-black leading-none text-white shadow-[0_0_14px_rgba(239,68,68,0.55)]"
            >
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {badgeLabel}
              </motion.span>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </button>

      {canUsePortal
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <>
            <motion.button
              type="button"
              aria-label="Close notifications"
              className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:bg-black/10 lg:backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={closeFromOutside}
            />
            <motion.aside
              id={panelId}
              role="dialog"
              aria-label="Notifications"
              className="fixed inset-x-0 bottom-0 z-[100] flex h-dvh flex-col overflow-hidden border-t border-white/10 bg-[#080914] shadow-[0_-24px_80px_rgba(0,0,0,0.62)] lg:inset-auto lg:right-4 lg:top-16 lg:h-auto lg:max-h-[min(72vh,620px)] lg:w-[430px] lg:rounded-[8px] lg:border lg:bg-[#080914]/98 lg:shadow-[0_24px_80px_rgba(0,0,0,0.52),0_0_42px_rgba(124,58,237,0.12)]"
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-cyan-200">Notifications</p>
                  <h2 className="mt-1 font-display text-lg font-bold text-[var(--text-primary)]">Latest updates</h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {unreadCount > 0 ? `${unreadCount} unread` : isFetching ? "Syncing" : "All caught up"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={!unreadCount || isMarkingAll}
                    className="focus-ring inline-flex h-9 items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <CheckCheck size={14} />
                    Mark all as read
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-[var(--text-secondary)] transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-[var(--text-primary)]"
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {notifications.length ? (
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                  <div className="grid gap-2">
                    <AnimatePresence initial={false}>
                      {notifications.map((notification) => (
                        <DropdownNotification
                          key={notification.id}
                          notification={notification}
                          onOpen={handleNotificationOpen}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <NotificationEmptyState />
              )}
            </motion.aside>
                </>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
