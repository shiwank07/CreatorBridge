export const NOTIFICATIONS_UPDATED_EVENT = "halo:notifications-updated";

export type NotificationsUpdatedDetail = {
  notificationId?: string;
  unreadCount?: number;
  readAt?: string;
  allRead?: boolean;
};

export function emitNotificationsUpdated(detail: NotificationsUpdatedDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent<NotificationsUpdatedDetail>(NOTIFICATIONS_UPDATED_EVENT, { detail }));
}
