import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminGlobalSearch } from "@/components/admin/admin-global-search";
import { requireAdmin } from "@/lib/admin";
import { NotificationIndicator } from "@/components/notifications/notification-indicator";
import { getCurrentUserNotificationSummary } from "@/lib/queries/notifications";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const notificationSummary = await getCurrentUserNotificationSummary(10);

  return (
    <main className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
      <AdminSidebar />
      <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1"><AdminGlobalSearch /></div>
          <NotificationIndicator initialNotifications={notificationSummary.notifications} initialUnreadCount={notificationSummary.unreadCount} />
        </div>
        {children}
      </section>
    </main>
  );
}
