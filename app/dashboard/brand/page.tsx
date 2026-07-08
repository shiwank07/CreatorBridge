import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Compass,
  FileCheck2,
  Layers3,
  Megaphone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { CollaborationBoard } from "@/components/collaborations/collaboration-board";
import { WorkingHistoryCard } from "@/components/collaborations/working-history-card";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { NotificationList } from "@/components/notifications/notification-list";
import { Badge } from "@/components/shared/badge";
import { Navbar } from "@/components/shared/navbar";
import { ProfileCompletionCard } from "@/components/shared/profile-completion-card";
import { BrandVerificationCard } from "@/components/verification/brand-verification-card";
import { TrustPassportCard } from "@/components/verification/trust-passport-card";
import { collaborationDetailsHref } from "@/lib/collaboration-routes";
import { collaborationStatusLabel } from "@/lib/collaborations";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { formatNumber } from "@/lib/format";
import { calculateBrandProfileCompletion } from "@/lib/profile-completion";
import { getBrandCollaborationDashboard, groupCollaborationsByStatus } from "@/lib/queries/collaborations";
import { getBrandByUsername } from "@/lib/queries/brands";
import { getCurrentUserNotificationSummary } from "@/lib/queries/notifications";
import { averageResponseTimeLabel, countDisputes } from "@/lib/trust-metrics";
import { type BrandInquiryData, type BrandProfileData, type InAppNotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { verificationBadgeLabel } from "@/lib/verification";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Brand Command Center",
  description: "Track brand collaboration requests on Branzzo.",
};

type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  Icon: LucideIcon;
  tone?: "cyan" | "violet" | "emerald" | "amber";
  delay?: string;
  href?: string;
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

function DashboardMetricCard({ label, value, detail, Icon, tone, delay = "", href }: MetricCardProps) {
  const content = (
    <>
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
    </>
  );
  const className = `animate-stat-up rounded-[8px] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${delay}`;

  return href ? (
    <Link href={href} className={`${className} focus-ring block transition hover:border-cyan-300/35 hover:bg-white/[0.065]`}>
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}

function verificationLabel(status?: BrandProfileData["verificationStatus"]) {
  return verificationBadgeLabel(status, "brand");
}

function verificationTone(status?: BrandProfileData["verificationStatus"]) {
  if (status === "verified") return "green";
  if (status === "pending") return "yellow";
  return "neutral";
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
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                    {item.creatorUsername ? `@${item.creatorUsername}` : item.companyName}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{item.timeline}</span>
                </span>
                <Badge tone={item.status === "DECLINED" || item.status === "CANCELLED" ? "neutral" : "green"} className="shrink-0">
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

function BrandVerificationStatus({ brand }: { brand: BrandProfileData | null }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Brand Verification Status</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{brand?.companyName ?? "Brand profile"}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {brand?.industry ?? "Industry not set"} {brand?.country ? `- ${brand.country}` : ""}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-violet-300/20 bg-violet-400/10 text-violet-100">
          <ShieldCheck size={20} />
        </span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone={verificationTone(brand?.verificationStatus)}>{verificationLabel(brand?.verificationStatus)}</Badge>
        {brand?.companySize ? <Badge tone="neutral">{brand.companySize}</Badge> : null}
        {brand?.website ? <Badge tone="neutral">Website linked</Badge> : null}
      </div>
      {brand?.verificationNote ? (
        <p className="mt-4 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-[var(--text-secondary)]">
          {brand.verificationNote}
        </p>
      ) : null}
      <Link href="/dashboard/brand/edit" className="bridge-button-secondary mt-5 w-full px-3 py-2 text-xs">
        Update brand profile
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function CampaignStatistics({
  collaborations,
  activeCount,
  proofCount,
  completedCount,
}: {
  collaborations: BrandInquiryData[];
  activeCount: number;
  proofCount: number;
  completedCount: number;
}) {
  const responseRate = collaborations.length ? Math.round(((activeCount + proofCount + completedCount) / collaborations.length) * 100) : 0;
  const proofShare = collaborations.length ? Math.round((proofCount / collaborations.length) * 100) : 0;

  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Campaign Statistics</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Campaign pulse</h2>
        </div>
        <BarChart3 size={22} className="text-cyan-200" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Total", formatNumber(collaborations.length)],
          ["Response rate", `${responseRate}%`],
          ["Proof queue", `${proofShare}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
            <p className="font-mono text-lg font-bold text-[var(--text-primary)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SavedCreators({ collaborations }: { collaborations: BrandInquiryData[] }) {
  const creatorNames = Array.from(new Set(collaborations.map((item) => item.creatorUsername).filter(Boolean))).slice(0, 5);

  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Saved Creators</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{creatorNames.length} in shortlist</h2>
        </div>
        <Star size={22} className="text-amber-200" />
      </div>
      <div className="mt-5 grid gap-2">
        {creatorNames.length ? (
          creatorNames.map((username) => (
            <Link
              key={username}
              href={`/creators/${username}`}
              className="focus-ring flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">@{username}</span>
              <ArrowRight size={14} className="shrink-0 text-[var(--text-muted)]" />
            </Link>
          ))
        ) : (
          <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-6 text-sm leading-6 text-[var(--text-secondary)]">
            No creators saved yet.
          </div>
        )}
      </div>
      <Link href="/creators" className="bridge-button-primary mt-5 w-full px-3 py-2 text-xs">
        Discover creators
        <Search size={14} />
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
  return <RecentActivityFeed accountType="brand" collaborations={collaborations} notifications={notifications} />;
}

function ProofReviewWidget({ collaborations }: { collaborations: BrandInquiryData[] }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Proof Review</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Review queue</h2>
        </div>
        <FileCheck2 size={22} className="text-emerald-200" />
      </div>
      <div className="mt-5 grid gap-3">
        {collaborations.length ? (
          collaborations.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">
                  {item.creatorUsername ? `@${item.creatorUsername}` : item.companyName}
                </p>
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-200" />
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">
                {item.deliveryProof?.notes || item.timeline}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-6 text-sm leading-6 text-[var(--text-secondary)]">
            No delivery proof is waiting for review.
          </div>
        )}
      </div>
    </section>
  );
}

function UpcomingCampaigns({ collaborations }: { collaborations: BrandInquiryData[] }) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Active Campaigns</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Live timelines</h2>
        </div>
        <CalendarClock size={22} className="text-violet-200" />
      </div>
      <div className="mt-5 grid gap-3">
        {collaborations.length ? (
          collaborations.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">
                  {item.creatorUsername ? `@${item.creatorUsername}` : item.companyName}
                </p>
                <Clock3 size={15} className="mt-0.5 shrink-0 text-amber-200" />
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{item.timeline}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-6 text-sm leading-6 text-[var(--text-secondary)]">
            No active campaign timelines yet.
          </div>
        )}
      </div>
    </section>
  );
}

export default async function BrandDashboardPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (clerkUserId && (!user || !user.onboardingComplete)) {
    redirect(user?.role === "creator" ? "/onboarding?role=creator" : "/onboarding?role=brand");
  }
  if (user?.onboardingComplete && user.role === "creator") redirect("/dashboard/creator");
  if (user?.onboardingComplete && user.role !== "brand") redirect("/dashboard");

  const [dashboard, notificationSummary, brandProfile] = await Promise.all([
    getBrandCollaborationDashboard(),
    getCurrentUserNotificationSummary(5),
    user?.username ? getBrandByUsername(user.username) : Promise.resolve(null),
  ]);

  const collaborations = dashboard.collaborations;
  const sentCollaborations = collaborations;
  const waitingForCreator = groupCollaborationsByStatus(collaborations, ["NEW", "PENDING_CREATOR_RESPONSE"]);
  const inProgress = groupCollaborationsByStatus(collaborations, ["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED"]);
  const proofReview = groupCollaborationsByStatus(collaborations, ["PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED"]);
  const completed = groupCollaborationsByStatus(collaborations, ["COMPLETED"]);
  const declined = groupCollaborationsByStatus(collaborations, ["DECLINED", "CANCELLED"]);
  const profileCompletion = calculateBrandProfileCompletion({
    brand: brandProfile,
    emailVerified: Boolean(user?.emailVerified),
    phoneVerified: Boolean(user?.phoneVerified || brandProfile?.phoneVerified),
    collaborations,
  });
  const responseTime = averageResponseTimeLabel(collaborations, "brand");
  const disputes = countDisputes(collaborations);
  const columns = [
    { title: "Sent", items: sentCollaborations },
    { title: "Waiting", items: waitingForCreator },
    { title: "In Progress", items: inProgress },
    { title: "Completed", items: completed },
    { title: "Declined", items: declined },
  ];

  return (
    <>
      <Navbar />
      <main className="bridge-section">
        <section className="relative overflow-hidden rounded-[8px] border border-cyan-300/15 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="bridge-eyebrow">Brand Command Center</p>
              <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">
                Welcome back, {brandProfile?.contactName ?? dashboard.user?.name ?? user?.name ?? "Brand team"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Monitor creator responses, active campaigns, proof reviews, and discovery signals from one command surface.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link href="/creators" className="bridge-button-primary w-full sm:w-auto">
                <Search size={17} />
                Discover Creators
              </Link>
              <Link href="#campaigns" className="bridge-button-secondary w-full sm:w-auto">
                <Megaphone size={17} />
                Campaigns
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard label="Waiting" value={waitingForCreator.length} detail="Briefs waiting for creator responses." Icon={UsersRound} tone="cyan" delay="stat-delay-1" href="#waiting-for-creator" />
          <DashboardMetricCard label="In Progress" value={inProgress.length} detail="Campaigns with accepted creators in motion." Icon={Layers3} tone="violet" delay="stat-delay-2" href="#active-campaigns" />
          <DashboardMetricCard label="Proof Review" value={proofReview.length} detail="Delivery proof and approvals needing attention." Icon={FileCheck2} tone="emerald" delay="stat-delay-3" href="#proof-review" />
          <DashboardMetricCard label="Unread" value={notificationSummary.unreadCount} detail="Notification signals from campaigns and verification." Icon={Sparkles} tone="amber" delay="stat-delay-4" href="#notifications" />
        </section>

        {!dashboard.user ? (
          <div className="mt-6 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            Sign in and complete brand onboarding to connect collaboration requests to this dashboard.
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 xl:grid-cols-4">
          <StageCard
            title="Sent Collaborations"
            copy="All outbound briefs and campaign requests sent from your brand workspace."
            items={sentCollaborations}
            Icon={Megaphone}
            empty="No collaboration requests have been sent yet."
          />
          <StageCard
            title="Waiting for Creator"
            copy="Track briefs that are still awaiting a creator decision."
            items={waitingForCreator}
            Icon={UsersRound}
            empty="No outbound briefs waiting right now."
          />
          <StageCard
            title="Active Campaigns"
            copy="Keep accepted creator work moving through delivery."
            items={inProgress}
            Icon={Megaphone}
            empty="No active campaigns yet."
          />
          <StageCard
            title="Proof Review"
            copy="Review submitted proof, approve delivery, or request changes."
            items={proofReview}
            Icon={FileCheck2}
            empty="No proof is waiting for review."
          />
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-4">
            <CampaignStatistics
              collaborations={collaborations}
              activeCount={inProgress.length}
              proofCount={proofReview.length}
              completedCount={completed.length}
            />
            <WorkingHistoryCard accountType="brand" collaborations={collaborations} />
            <RecentActivity collaborations={collaborations} notifications={notificationSummary.notifications} />
            <ProofReviewWidget collaborations={proofReview} />
          </div>
          <div className="grid gap-4">
            <BrandVerificationStatus brand={brandProfile} />
            <ProfileCompletionCard completion={profileCompletion} updateHref="/dashboard/brand/edit" />
            <BrandVerificationCard brand={brandProfile} />
            <TrustPassportCard
              accountType="brand"
              emailVerified={Boolean(user?.emailVerified)}
              phoneAdded={Boolean(user?.phoneNumber || brandProfile?.phoneAdded)}
              phoneVerified={Boolean(user?.phoneVerified || brandProfile?.phoneVerified)}
              verificationStatus={brandProfile?.verificationStatus}
              completedCollaborations={completed.length}
              joinedDate={brandProfile?.createdAt}
              responseTimeLabel={responseTime}
              disputes={disputes}
              className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5"
            />
            <SavedCreators collaborations={collaborations} />
            <UpcomingCampaigns collaborations={inProgress} />
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

        <section id="campaigns" className="mt-8">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="bridge-eyebrow">Campaign Operations</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Command board</h2>
            </div>
            <Link href="/creators" className="bridge-button-secondary w-full sm:w-auto">
              <Compass size={17} />
              Discover more creators
            </Link>
          </div>
          <CollaborationBoard columns={columns} mode="brand" />
        </section>
      </main>
    </>
  );
}

