import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Plus } from "lucide-react";

import { CollaborationBoard } from "@/components/collaborations/collaboration-board";
import { NotificationList } from "@/components/notifications/notification-list";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { getBrandCollaborationDashboard, groupCollaborationsByStatus } from "@/lib/queries/collaborations";
import { getCurrentUserNotificationSummary } from "@/lib/queries/notifications";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Brand Dashboard",
  description: "Track brand collaboration requests on CreatorBridge.",
};

export default async function BrandDashboardPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (clerkUserId && (!user || !user.onboardingComplete)) redirect("/onboarding?role=brand");
  if (user?.role === "creator") redirect("/dashboard/creator");
  if (user && user.role !== "brand") redirect("/onboarding?role=brand");

  const dashboard = await getBrandCollaborationDashboard();
  const collaborations = dashboard.collaborations;
  const notificationSummary = await getCurrentUserNotificationSummary(5);
  const columns = [
    { title: "Waiting for Creator", items: groupCollaborationsByStatus(collaborations, ["new", "viewed"]) },
    { title: "Active Collaborations", items: groupCollaborationsByStatus(collaborations, ["interested", "work_started", "changes_requested"]) },
    { title: "Proof Review", items: groupCollaborationsByStatus(collaborations, ["proof_submitted", "approved"]) },
    { title: "Completed", items: groupCollaborationsByStatus(collaborations, ["completed", "closed"]) },
  ];

  return (
    <>
      <Navbar />
      <main className="bridge-section">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="bridge-eyebrow">Brand Dashboard</p>
            <h1 className="mt-3 font-display text-4xl font-black">Collaboration Requests</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Manage creator collaboration requests from draft planning through active work and completion.
            </p>
          </div>
          <Link href="/creators" className="bridge-button-primary w-full md:w-auto">
            <Plus size={17} />
            Browse Creators
          </Link>
        </div>

        <div id="sent-collaborations" className="mt-6 grid gap-3 md:grid-cols-5">
          {[
            ["Sent Collaborations", collaborations.length],
            ["Waiting for Creator", columns[0].items.length],
            ["Active Collaborations", columns[1].items.length],
            ["Proof Review", columns[2].items.length],
            ["Notifications", notificationSummary.unreadCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-mono text-2xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p>
            </div>
          ))}
        </div>

        {!dashboard.user ? (
          <div className="mt-6 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            Sign in and complete brand onboarding to connect collaboration requests to this dashboard.
          </div>
        ) : null}

        <div className="mt-8">
          <CollaborationBoard columns={columns} mode="brand" />
        </div>

        <section id="notifications" className="mt-8 rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="bridge-eyebrow">Notifications</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Recent updates</h2>
            </div>
            <Link href="/notifications" className="bridge-button-secondary w-full sm:w-auto">
              View All
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="mt-5">
            <NotificationList notifications={notificationSummary.notifications} compact />
          </div>
        </section>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/onboarding?role=brand" className="bridge-button-secondary w-full sm:w-auto">
            <Building2 size={17} />
            Update Brand Profile
          </Link>
          <Link href="/creators" className="bridge-button-secondary w-full sm:w-auto">
            Browse Creators
            <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    </>
  );
}
