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
type HistorySort = "newest" | "oldest";
type HistorySearchParams = Promise<Record<string, string | string[] | undefined>>;
const HISTORY_PAGE_SIZE = 10;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

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
            <div key={collaboration.id} data-testid="history-record">
              <CollaborationCard collaboration={collaboration} accountType={accountType} />
            </div>
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

export default async function CollaborationHistoryPage({
  searchParams,
}: {
  searchParams: HistorySearchParams;
}) {
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
  const params = await searchParams;
  const query = readParam(params.q).trim().toLowerCase();
  const requestedStatus = readParam(params.status);
  const status: HistoryBucket | "all" =
    requestedStatus === "active" || requestedStatus === "completed" || requestedStatus === "declined"
      ? requestedStatus
      : "all";
  const sort: HistorySort = readParam(params.sort) === "oldest" ? "oldest" : "newest";
  const requestedPage = Number.parseInt(readParam(params.page), 10);
  const filteredCollaborations = dashboard.collaborations
    .filter((collaboration) => status === "all" || collaborationHistoryBucket(collaboration.status) === status)
    .filter((collaboration) => {
      if (!query) return true;
      return [
        partnerName(collaboration, accountType),
        collaboration.companyName,
        collaboration.creatorUsername,
        collaboration.campaignGoal,
        collaborationStatusLabel(collaboration.status),
      ].some((value) => value?.toLowerCase().includes(query));
    })
    .sort((first, second) => {
      const firstTime = new Date(first.createdAt ?? 0).getTime();
      const secondTime = new Date(second.createdAt ?? 0).getTime();
      return sort === "oldest" ? firstTime - secondTime : secondTime - firstTime;
    });
  const pageCount = Math.max(1, Math.ceil(filteredCollaborations.length / HISTORY_PAGE_SIZE));
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), pageCount);
  const pageItems = filteredCollaborations.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);
  const pageHref = (targetPage: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status !== "all") next.set("status", status);
    if (sort !== "newest") next.set("sort", sort);
    next.set("page", String(targetPage));
    return `/dashboard/history?${next.toString()}`;
  };

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

        <form className="mb-8 grid gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <label className="min-w-0">
            <span className="bridge-label">Search history</span>
            <input
              name="q"
              defaultValue={readParam(params.q)}
              className="bridge-input mt-2"
              placeholder="Brand, creator, campaign, or status"
            />
          </label>
          <label>
            <span className="bridge-label">Status</span>
            <select name="status" defaultValue={status} className="bridge-input mt-2">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined/cancelled</option>
            </select>
          </label>
          <label>
            <span className="bridge-label">Sort</span>
            <select name="sort" defaultValue={sort} className="bridge-input mt-2">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <button type="submit" className="bridge-button-primary self-end">Apply</button>
        </form>

        {!hasAnyCollaborations ? (
          <section className="mb-8 rounded-[8px] border border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
            <CircleDollarSign size={24} className="mx-auto text-cyan-200" />
            <h2 className="mt-3 font-display text-2xl font-bold">No collaboration history yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Active, completed, and declined collaborations will appear here once offers move through Branzzo.
            </p>
          </section>
        ) : null}

        <div className="grid gap-5">
          <HistorySection
            title={status === "all" ? "All collaborations" : `${status[0].toUpperCase()}${status.slice(1)} collaborations`}
            description={`Showing ${pageItems.length} of ${filteredCollaborations.length} matching records.`}
            collaborations={pageItems}
            accountType={accountType}
          />
          {pageCount > 1 ? (
            <nav aria-label="History pagination" className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
              <p className="text-sm text-[var(--text-secondary)]">Page {page} of {pageCount}</p>
              <div className="flex gap-2">
                {page > 1 ? <Link href={pageHref(page - 1)} className="bridge-button-secondary px-4 py-2 text-sm">Previous</Link> : null}
                {page < pageCount ? <Link href={pageHref(page + 1)} className="bridge-button-secondary px-4 py-2 text-sm">Next</Link> : null}
              </div>
            </nav>
          ) : null}
        </div>
      </main>
    </>
  );
}
