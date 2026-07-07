import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, CircleDollarSign, History, XCircle, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { Navbar } from "@/components/shared/navbar";
import { collaborationDetailsHref } from "@/lib/collaboration-routes";
import { collaborationHistoryBucket, collaborationStatusLabel } from "@/lib/collaborations";
import { getBrandCollaborationDashboard, getCreatorCollaborationDashboard } from "@/lib/queries/collaborations";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { formatINR } from "@/lib/format";
import { type BrandInquiryData } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collaboration History",
  description: "Review active, completed, and declined Branzzo collaborations.",
};

type AccountType = "creator" | "brand";
type HistoryBucket = "active" | "completed" | "declined";

function formatDate(value?: string) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function currentOffer(collaboration: BrandInquiryData) {
  return collaboration.currentOfferAmount ? formatINR(collaboration.currentOfferAmount) : "Exact offer not recorded";
}

function partnerName(collaboration: BrandInquiryData, accountType: AccountType) {
  if (accountType === "brand") return collaboration.creatorUsername ? `@${collaboration.creatorUsername}` : "Creator not linked";
  return collaboration.companyName;
}

function bucketCollaborations(collaborations: BrandInquiryData[]) {
  return collaborations.reduce<Record<HistoryBucket, BrandInquiryData[]>>(
    (groups, collaboration) => {
      groups[collaborationHistoryBucket(collaboration.status)].push(collaboration);
      return groups;
    },
    { active: [], completed: [], declined: [] },
  );
}

function StatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  tone: "cyan" | "green" | "neutral";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : tone === "cyan"
        ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
        : "border-white/10 bg-white/[0.04] text-[var(--text-secondary)]";

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-3xl font-bold text-[var(--text-primary)]">{value}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border ${toneClass}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

function CollaborationCard({ collaboration, accountType }: { collaboration: BrandInquiryData; accountType: AccountType }) {
  return (
    <article className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-xl font-bold">{partnerName(collaboration, accountType)}</h3>
            <Badge tone={collaboration.status === "DECLINED" || collaboration.status === "CANCELLED" ? "neutral" : "green"}>
              {collaborationStatusLabel(collaboration.status)}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{collaboration.campaignGoal}</p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Offer amount</p>
              <p className="mt-1 text-[var(--text-primary)]">{currentOffer(collaboration)}</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Timeline</p>
              <p className="mt-1 text-[var(--text-primary)]">{collaboration.timeline}</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Created</p>
              <p className="mt-1 text-[var(--text-primary)]">{formatDate(collaboration.createdAt)}</p>
            </div>
          </div>
        </div>
        <Link href={collaborationDetailsHref(collaboration.id)} className="bridge-button-secondary shrink-0 px-4 py-2 text-sm">
          View details
        </Link>
      </div>
    </article>
  );
}

function HistorySection({
  title,
  description,
  collaborations,
  accountType,
}: {
  title: string;
  description: string;
  collaborations: BrandInquiryData[];
  accountType: AccountType;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
        <Badge tone="neutral">{collaborations.length}</Badge>
      </div>
      {collaborations.length ? (
        <div className="grid gap-4">
          {collaborations.map((collaboration) => (
            <CollaborationCard key={collaboration.id} collaboration={collaboration} accountType={accountType} />
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-white/10 bg-white/[0.025] p-5 text-sm leading-6 text-[var(--text-secondary)]">
          Nothing in this section yet.
        </div>
      )}
    </section>
  );
}

export default async function CollaborationHistoryPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (!clerkUserId) redirect("/sign-in");
  if (!user || !user.onboardingComplete) {
    redirect(user?.role === "brand" ? "/onboarding?role=brand" : user?.role === "creator" ? "/onboarding?role=creator" : "/onboarding");
  }
  if (user.role !== "creator" && user.role !== "brand") redirect("/dashboard");

  const dashboardHref = user.role === "brand" ? "/dashboard/brand" : "/dashboard/creator";
  const accountType = user.role;
  const dashboard = accountType === "brand" ? await getBrandCollaborationDashboard() : await getCreatorCollaborationDashboard();
  const groups = bucketCollaborations(dashboard.collaborations);
  const hasAnyCollaborations = dashboard.collaborations.length > 0;

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-6xl py-8 sm:py-10">
        <Link href={dashboardHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="mb-6 rounded-[8px] border border-cyan-300/15 bg-white/[0.045] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="bridge-eyebrow">Collaboration History</p>
              <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">Your collaboration record</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Review active work, completed collaborations, declined or cancelled opportunities, and offer changes.
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              <History size={22} />
            </span>
          </div>
        </header>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <StatCard label="Active collaborations" value={groups.active.length} Icon={BriefcaseBusiness} tone="cyan" />
          <StatCard label="Completed collaborations" value={groups.completed.length} Icon={CheckCircle2} tone="green" />
          <StatCard label="Declined/cancelled collaborations" value={groups.declined.length} Icon={XCircle} tone="neutral" />
        </div>

        {!hasAnyCollaborations ? (
          <section className="mb-8 rounded-[8px] border border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
            <CircleDollarSign size={24} className="mx-auto text-cyan-200" />
            <h2 className="mt-3 font-display text-2xl font-bold">No collaboration history yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Active, completed, and declined collaborations will appear here once offers move through Branzzo.
            </p>
          </section>
        ) : null}

        <div className="grid gap-8">
          <HistorySection
            title="Active collaborations"
            description="Offers, accepted work, proof review, and other in-progress collaborations."
            collaborations={groups.active}
            accountType={accountType}
          />
          <HistorySection
            title="Completed collaborations"
            description="Collaborations that have been completed or closed."
            collaborations={groups.completed}
            accountType={accountType}
          />
          <HistorySection
            title="Declined/cancelled collaborations"
            description="Offers that ended without moving forward."
            collaborations={groups.declined}
            accountType={accountType}
          />
        </div>
      </main>
    </>
  );
}
