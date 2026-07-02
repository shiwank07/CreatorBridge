import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Compass,
  FileCheck2,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { CollaborationBoard } from "@/components/collaborations/collaboration-board";
import { WorkingHistoryCard } from "@/components/collaborations/working-history-card";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { NotificationList } from "@/components/notifications/notification-list";
import { Badge } from "@/components/shared/badge";
import { Navbar } from "@/components/shared/navbar";
import { CreatorVerificationCard } from "@/components/verification/creator-verification-card";
import { TrustPassportCard } from "@/components/verification/trust-passport-card";
import { collaborationDetailsHref } from "@/lib/collaboration-routes";
import { collaborationStatusLabel } from "@/lib/collaborations";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { formatINR, formatNumber } from "@/lib/format";
import { getCreatorCollaborationDashboard, groupCollaborationsByStatus } from "@/lib/queries/collaborations";
import { getCreatorByUsername } from "@/lib/queries/creators";
import { getCurrentUserNotificationSummary } from "@/lib/queries/notifications";
import { getPublicSubscriberCount, verificationBadgeLabel } from "@/lib/verification";
import { type BrandInquiryData, type CreatorCardData, type InAppNotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creator Command Center",
  description: "Track creator collaboration requests on CreatorBridge.",
};

type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  Icon: LucideIcon;
  tone?: "cyan" | "violet" | "emerald" | "amber";
  delay?: string;
};

function metricTone(tone: MetricCardProps["tone"] = "cyan") {
  const tones = {
    cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    violet: "border-violet-300/20 bg-violet-400/10 text-violet-100",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  };

  return tones[tone];
}

function DashboardMetricCard({ label, value, detail, Icon, tone, delay = "" }: MetricCardProps) {
  return (
    <article className={`animate-stat-up rounded-[8px] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${delay}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">{label}</p>
          <p className="mt-3 font-mono text-3xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border", metricTone(tone))}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
    </article>
  );
}

function profileCompletionFields(creator: CreatorCardData | null) {
  return [
    { label: "Bio", done: Boolean(creator?.bio) },
    { label: "Niche", done: Boolean(creator?.niche.length) },
    { label: "Country", done: Boolean(creator?.country) },
    { label: "Languages", done: Boolean(creator?.languages.length) },
    { label: "Platform link", done: Boolean(creator?.youtubeUrl || creator?.instagramUrl || creator?.podcastUrl) },
    { label: "Audience stats", done: Boolean((creator?.subscribers ?? 0) > 0 || (creator?.instagramFollowers ?? 0) > 0) },
    { label: "Base rate", done: Boolean((creator?.sponsorshipRate ?? 0) > 0) },
    { label: "Sample work", done: Boolean(creator?.sampleWorkUrls.length) },
  ];
}

function profileCompletionPercent(creator: CreatorCardData | null) {
  const fields = profileCompletionFields(creator);
  const completed = fields.filter((field) => field.done).length;

  return Math.round((completed / fields.length) * 100);
}

function verificationCopy(creator: CreatorCardData | null) {
  if (!creator) return "Profile pending";
  return verificationBadgeLabel(creator.verificationStatus);
}

function StageCard({
  title,
  copy,
  items,
  Icon,
  empty,
}: {
  title: string;
  copy: string;
  items: BrandInquiryData[];
  Icon: LucideIcon;
  empty: string;
}) {
  return (
    <section className="animate-stat-up rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-200">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {items.length ? (
          items.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              href={collaborationDetailsHref(item.id)}
              className="focus-ring rounded-[8px] border border-white/10 bg-black/20 p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{item.companyName}</span>
                  <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{item.timeline}</span>
                </span>
                <Badge tone={item.status === "closed" || item.status === "offer_declined" ? "neutral" : "green"} className="shrink-0">
                  {collaborationStatusLabel(item.status)}
                </Badge>
              </span>
            </Link>
          ))
        ) : (
          <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-6 text-sm leading-6 text-[var(--text-secondary)]">{empty}</div>
        )}
      </div>
    </section>
  );
}

function CreatorPassport({ creator }: { creator: CreatorCardData | null }) {
  const reach = creator ? getPublicSubscriberCount(creator) : 0;

  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Creator Passport</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{creator?.name ?? "Creator profile"}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            @{creator?.username ?? "pending"} - {creator?.niche.slice(0, 2).join(", ") || "Niche not set"}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-violet-300/20 bg-violet-400/10 text-violet-100">
          <ShieldCheck size={20} />
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Reach", formatNumber(reach)],
          ["Avg views", formatNumber(creator?.avgViews)],
          ["Base rate", formatINR(creator?.sponsorshipRate)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
            <p className="font-mono text-lg font-bold text-[var(--text-primary)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={creator?.isOpenToDeals ? "green" : "neutral"}>{creator?.isOpenToDeals ? "Open to deals" : "Availability quiet"}</Badge>
        <Badge tone={creator?.isVerified ? "green" : "neutral"}>{verificationCopy(creator)}</Badge>
        {creator?.country ? <Badge tone="neutral">{creator.country}</Badge> : null}
      </div>
    </section>
  );
}

function ProfileCompletion({ creator }: { creator: CreatorCardData | null }) {
  const fields = profileCompletionFields(creator);
  const percent = profileCompletionPercent(creator);

  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Profile Completion</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{percent}% ready</h2>
        </div>
        <Gauge size={22} className="text-cyan-200" />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-emerald-300" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <CheckCircle2 size={14} className={field.done ? "text-emerald-300" : "text-[var(--text-muted)]"} />
            <span>{field.label}</span>
          </div>
        ))}
      </div>
      <Link href="/onboarding?role=creator" className="bridge-button-secondary mt-5 w-full px-3 py-2 text-xs">
        Update profile
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function RecentActivity({
  collaborations,
  notifications,
}: {
  collaborations: BrandInquiryData[];
  notifications: InAppNotificationData[];
}) {
  return <RecentActivityFeed accountType="creator" collaborations={collaborations} notifications={notifications} />;
}

function UpcomingDeadlines({ collaborations }: { collaborations: BrandInquiryData[] }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Upcoming Deadlines</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Next delivery windows</h2>
        </div>
        <CalendarClock size={22} className="text-violet-200" />
      </div>
      <div className="mt-5 grid gap-3">
        {collaborations.length ? (
          collaborations.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">{item.companyName}</p>
                <Clock3 size={15} className="mt-0.5 shrink-0 text-amber-200" />
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{item.timeline}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-6 text-sm leading-6 text-[var(--text-secondary)]">
            No active delivery windows yet.
          </div>
        )}
      </div>
    </section>
  );
}

export default async function CreatorDashboardPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (clerkUserId && (!user || !user.onboardingComplete)) {
    redirect(user?.role === "brand" ? "/onboarding?role=brand" : "/onboarding?role=creator");
  }
  if (user?.onboardingComplete && user.role === "brand") redirect("/dashboard/brand");
  if (user?.onboardingComplete && user.role !== "creator") redirect("/dashboard");

  const [dashboard, notificationSummary, creatorProfile] = await Promise.all([
    getCreatorCollaborationDashboard(),
    getCurrentUserNotificationSummary(5),
    user?.username ? getCreatorByUsername(user.username) : Promise.resolve(null),
  ]);

  const collaborations = dashboard.collaborations;
  const newRequests = groupCollaborationsByStatus(collaborations, ["offer_sent", "counter_sent", "new", "viewed"]);
  const ongoing = groupCollaborationsByStatus(collaborations, ["counter_requested", "offer_accepted", "interested", "work_started", "changes_requested"]);
  const proofReview = groupCollaborationsByStatus(collaborations, ["proof_submitted", "approved"]);
  const completed = groupCollaborationsByStatus(collaborations, ["completed", "closed"]);
  const declined = groupCollaborationsByStatus(collaborations, ["offer_declined"]);
  const activeWork = [...ongoing, ...proofReview];
  const columns = [
    { title: "New Collaboration Requests", items: newRequests },
    { title: "Ongoing Collaborations", items: ongoing },
    { title: "Proof Review", items: proofReview },
    { title: "Completed Collaborations", items: completed },
    { title: "Declined Collaborations", items: declined },
  ];

  return (
    <>
      <Navbar />
      <main className="bridge-section">
        <section className="relative overflow-hidden rounded-[8px] border border-cyan-300/15 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="bridge-eyebrow">Creator Command Center</p>
              <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">
                Welcome back, {dashboard.user?.name ?? user?.name ?? "Creator"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Your collaboration radar, delivery queue, and creator profile health in one focused command surface.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link href="#collaborations" className="bridge-button-primary w-full sm:w-auto">
                <BriefcaseBusiness size={17} />
                Collaborations
              </Link>
              <Link href={creatorProfile ? `/creators/${creatorProfile.username}` : "/onboarding?role=creator"} className="bridge-button-secondary w-full sm:w-auto">
                <UserRound size={17} />
                My Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard label="New Requests" value={newRequests.length} detail="Fresh brand briefs waiting for your response." Icon={Bell} tone="cyan" delay="stat-delay-1" />
          <DashboardMetricCard label="Ongoing" value={activeWork.length} detail="Accepted work, proof updates, and live delivery loops." Icon={Layers3} tone="violet" delay="stat-delay-2" />
          <DashboardMetricCard label="Completed" value={completed.length} detail="Completed collaborations in your work history." Icon={FileCheck2} tone="emerald" delay="stat-delay-3" />
          <DashboardMetricCard label="Unread" value={notificationSummary.unreadCount} detail="Notification signals that still need attention." Icon={Sparkles} tone="amber" delay="stat-delay-4" />
        </section>

        {!dashboard.user ? (
          <div className="mt-6 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            Sign in and complete creator onboarding to connect collaborations to this dashboard.
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 xl:grid-cols-4">
          <StageCard
            title="New Collaboration Requests"
            copy="Decide quickly which campaigns belong in your pipeline."
            items={newRequests}
            Icon={ClipboardList}
            empty="No new requests waiting right now."
          />
          <StageCard
            title="Ongoing Collaborations"
            copy="Keep active work moving from accepted to submitted."
            items={activeWork}
            Icon={BriefcaseBusiness}
            empty="No active collaborations yet."
          />
          <StageCard
            title="Delivery Proof"
            copy="Submit proof or respond to requested changes."
            items={proofReview}
            Icon={FileCheck2}
            empty="No delivery proof is waiting right now."
          />
          <StageCard
            title="Completed Collaborations"
            copy="Review your closed work and campaign history."
            items={completed}
            Icon={BadgeCheck}
            empty="Completed work will collect here."
          />
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-4">
            <CreatorPassport creator={creatorProfile} />
            <TrustPassportCard
              accountType="creator"
              emailVerified={Boolean(user?.email)}
              verificationStatus={creatorProfile?.verificationStatus}
              completedCollaborations={completed.length}
              className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5"
            />
            <WorkingHistoryCard accountType="creator" collaborations={collaborations} />
            <RecentActivity collaborations={collaborations} notifications={notificationSummary.notifications} />
          </div>
          <div className="grid gap-4">
            <CreatorVerificationCard creator={creatorProfile} />
            <ProfileCompletion creator={creatorProfile} />
            <UpcomingDeadlines collaborations={activeWork} />
          </div>
        </section>

        <section id="notifications" className="mt-8 rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="bridge-eyebrow">Notification Widget</p>
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

        <section id="collaborations" className="mt-8">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="bridge-eyebrow">Collaboration Operations</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Command board</h2>
            </div>
            <Link href="/creators" className="bridge-button-secondary w-full sm:w-auto">
              <Compass size={17} />
              Browse Creator Pages
            </Link>
          </div>
          <CollaborationBoard columns={columns} mode="creator" />
        </section>
      </main>
    </>
  );
}

