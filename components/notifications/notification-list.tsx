import Link from "next/link";
import { Bell, ExternalLink } from "lucide-react";

import { type InAppNotificationData } from "@/lib/types";

type NotificationListProps = {
  notifications: InAppNotificationData[];
  compact?: boolean;
};

function notificationDate(value?: string) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationList({ notifications, compact = false }: NotificationListProps) {
  if (!notifications.length) {
    return (
      <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-8 text-center text-sm leading-6 text-[var(--text-secondary)]">
        No notifications yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href={notification.href}
          className="focus-ring flex items-start gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <Bell size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span className="font-semibold text-[var(--text-primary)]">{notification.title}</span>
              <ExternalLink size={14} className="mt-1 shrink-0 text-[var(--text-muted)]" />
            </span>
            <span className={`${compact ? "line-clamp-2" : ""} mt-1 block text-sm leading-6 text-[var(--text-secondary)]`}>
              {notification.message}
            </span>
            <span className="mt-2 block text-xs text-[var(--text-muted)]">{notificationDate(notification.createdAt)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
