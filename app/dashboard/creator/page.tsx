import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus, UserRound } from "lucide-react";

import { CollaborationBoard } from "@/components/collaborations/collaboration-board";
import { NotificationList } from "@/components/notifications/notification-list";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { getCreatorCollaborationDashboard, groupCollaborationsByStatus } from "@/lib/queries/collaborations";
import { getCurrentUserNotificationSummary } from "@/lib/queries/notifications";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creator Dashboard",
  description: "Track creator collaboration requests on CreatorBridge.",
};

export default async function CreatorDashboardPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (clerkUserId && (!user || !user.onboardingComplete)) redirect("/onboarding?role=creator");
  if (user?.role === "brand") redirect("/dashboard/brand");
  if (user && user.role !== "creator") redirect("/onboarding?role=creator");

  const dashboard = await getCreatorCollaborationDashboard();
  const collaborations = dashboard.collaborations;
  const notificationSummary = await getCurrentUserNotificationSummary(5);
  const columns = [
    { title: "New Collaboration Requests", items: groupCollaborationsByStatus(collaborations, ["new", "viewed"]) },
    { title: "Ongoing Collaborations", items: groupCollaborationsByStatus(collaborations, ["interested", "work_started", "changes_requested"]) },
    { title: "Delivery Proof", items: groupCollaborationsByStatus(collaborations, ["proof_submitted", "approved"]) },
    { title: "Work History", items: groupCollaborationsByStatus(collaborations, ["completed", "closed"]) },
  ];

  return (
    <>
      <Navbar />
      <main className="bridge-section">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="bridge-eyebrow">Creator Dashboard</p>
            <h1 className="mt-3 font-display text-4xl font-black">Collaboration Requests</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Review incoming collaboration requests, respond with interest or decline, and track active work.
            </p>
          </div>
          <Link href="/creators" className="bridge-button-secondary w-full md:w-auto">
            <UserRound size={17} />
            View Directory
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["Total", collaborations.length],
            ["Incoming", columns[0].items.length],
            ["Active", columns[1].items.length + columns[2].items.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-mono text-2xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p>
            </div>
          ))}
        </div>

        {!dashboard.user ? (
          <div className="mt-6 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            Sign in and complete creator onboarding to connect collaborations to this dashboard.
          </div>
        ) : null}

        <div id="new-requests" className="mt-8">
          <CollaborationBoard columns={columns} mode="creator" />
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
          <Link href="/onboarding?role=creator" className="bridge-button-secondary w-full sm:w-auto">
            <Plus size={17} />
            Update Creator Profile
          </Link>
          <Link href="/creators" className="bridge-button-primary w-full sm:w-auto">
            Browse Creator Pages
            <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    </>
  );
}
