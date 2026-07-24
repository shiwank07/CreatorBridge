"use client";

import { useState } from "react";
import { CheckCheck, LoaderCircle } from "lucide-react";

import { emitNotificationsUpdated } from "@/components/notifications/notification-events";

export function NotificationPageActions({ unreadCount }: { unreadCount: number }) {
  const [remaining, setRemaining] = useState(unreadCount);
  const [loading, setLoading] = useState(false);

  async function markAllRead() {
    if (!remaining || loading) return;
    setLoading(true);
    const response = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (response.ok) {
      setRemaining(0);
      emitNotificationsUpdated({ allRead: true, unreadCount: 0, readAt: new Date().toISOString() });
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <button type="button" onClick={markAllRead} disabled={!remaining || loading} className="bridge-button-secondary w-full sm:w-auto">
      {loading ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCheck size={16} />}
      Mark all as read
    </button>
  );
}
