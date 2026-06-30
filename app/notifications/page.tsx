import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { NotificationList } from "@/components/notifications/notification-list";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { getCurrentUserNotifications } from "@/lib/queries/notifications";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications",
  description: "View your CreatorBridge collaboration notifications.",
};

export default async function NotificationsPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (!clerkUserId) redirect("/sign-in");
  if (!user || !user.onboardingComplete) redirect("/onboarding");
  if (user.role !== "brand" && user.role !== "creator") redirect("/onboarding");

  const notifications = await getCurrentUserNotifications(100);
  const dashboardHref = user.role === "brand" ? "/dashboard/brand" : "/dashboard/creator";

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-4xl py-8 sm:py-10">
        <Link href={dashboardHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
        <div className="mb-6">
          <p className="bridge-eyebrow">Notifications</p>
          <h1 className="mt-3 font-display text-4xl font-black">Your updates</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Track collaboration requests, creator responses, proof reviews, and verification updates in one place.
          </p>
        </div>
        <section className="bridge-card p-5">
          <NotificationList notifications={notifications} />
        </section>
      </main>
    </>
  );
}
