import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { NotificationList } from "@/components/notifications/notification-list";
import { NotificationPageActions } from "@/components/notifications/notification-page-actions";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { getCurrentUserNotificationPage } from "@/lib/queries/notifications";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications",
  description: "View your Branzzo collaboration notifications.",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}) {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (!clerkUserId) redirect("/sign-in");
  if (!user || !user.onboardingComplete) {
    redirect(user?.role === "brand" ? "/onboarding?role=brand" : user?.role === "creator" ? "/onboarding?role=creator" : "/onboarding");
  }
  if (user.role !== "brand" && user.role !== "creator" && user.role !== "admin") redirect("/dashboard");

  const params = await searchParams;
  const status = params.status === "unread" || params.status === "read" ? params.status : "all";
  const type = params.type?.trim().slice(0, 80) ?? "";
  const result = await getCurrentUserNotificationPage({
    status,
    type,
    page: Number(params.page) || 1,
    pageSize: 30,
  });
  const dashboardHref = user.role === "brand" ? "/dashboard/brand" : user.role === "creator" ? "/dashboard/creator" : "/admin";
  const pageHref = (page: number) => {
    const next = new URLSearchParams();
    if (status !== "all") next.set("status", status);
    if (type) next.set("type", type);
    next.set("page", String(page));
    return `/notifications?${next}`;
  };

  return (
    <>
      <Navbar role={user.role === "creator" || user.role === "brand" || user.role === "admin" ? user.role : undefined} username={user.username} />
      <main className="bridge-section max-w-4xl py-8 sm:py-10">
        <Link href={dashboardHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="bridge-eyebrow">Notifications</p>
            <h1 className="mt-3 font-display text-4xl font-black">Your updates</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Track collaboration requests, creator responses, proof reviews, and verification updates in one place.
          </p>
          </div>
          <NotificationPageActions unreadCount={result.unreadCount} />
        </div>
        <nav aria-label="Notification filters" className="mb-4 flex max-w-full gap-2 overflow-x-auto">
          {(["all", "unread", "read"] as const).map((value) => (
            <Link key={value} href={`/notifications?status=${value}${type ? `&type=${encodeURIComponent(type)}` : ""}`} className={status === value ? "bridge-button-primary shrink-0" : "bridge-button-secondary shrink-0"}>
              {value[0].toUpperCase() + value.slice(1)}
            </Link>
          ))}
          <Link href={`/notifications?status=${status}&type=chat_message`} className={type === "chat_message" ? "bridge-button-primary shrink-0" : "bridge-button-secondary shrink-0"}>Messages</Link>
          <Link href={`/notifications?status=${status}&type=verification_submitted`} className={type.startsWith("verification_") ? "bridge-button-primary shrink-0" : "bridge-button-secondary shrink-0"}>Verification</Link>
        </nav>
        <section className="bridge-card p-5">
          <NotificationList notifications={result.notifications} />
        </section>
        <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-[var(--text-secondary)]">Page {result.page} of {result.totalPages} · {result.total} results</p>
          <div className="flex gap-2">
            {result.page > 1 ? <Link href={pageHref(result.page - 1)} className="bridge-button-secondary"><ChevronLeft size={16} /> Previous</Link> : null}
            {result.page < result.totalPages ? <Link href={pageHref(result.page + 1)} className="bridge-button-secondary">Next <ChevronRight size={16} /></Link> : null}
          </div>
        </div>
      </main>
    </>
  );
}
