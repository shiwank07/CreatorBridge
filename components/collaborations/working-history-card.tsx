import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, History, RotateCcw, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { collaborationDetailsHref } from "@/lib/collaboration-routes";
import { collaborationHistoryBucket, collaborationStatusLabel } from "@/lib/collaborations";
import { type BrandInquiryData } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CollaborationHistorySummary = {
  active: number;
  completed: number;
  declined: number;
};

type WorkingHistoryCardProps = {
  accountType: "creator" | "brand";
  collaborations?: BrandInquiryData[];
  summary?: Partial<CollaborationHistorySummary>;
  showDetails?: boolean;
  className?: string;
};

function summarize(collaborations: BrandInquiryData[] = [], summary?: Partial<CollaborationHistorySummary>): CollaborationHistorySummary {
  const computed = collaborations.reduce<CollaborationHistorySummary>(
    (counts, collaboration) => {
      counts[collaborationHistoryBucket(collaboration.status)] += 1;
      return counts;
    },
    { active: 0, completed: 0, declined: 0 },
  );

  return {
    active: summary?.active ?? computed.active,
    completed: summary?.completed ?? computed.completed,
    declined: summary?.declined ?? computed.declined,
  };
}

function bucketItems(collaborations: BrandInquiryData[], bucket: keyof CollaborationHistorySummary) {
  return collaborations.filter((collaboration) => collaborationHistoryBucket(collaboration.status) === bucket);
}

function displayName(collaboration: BrandInquiryData, accountType: "creator" | "brand") {
  if (accountType === "brand") return collaboration.creatorUsername ? `@${collaboration.creatorUsername}` : "Creator not linked";
  return collaboration.companyName;
}

function HistoryList({
  title,
  items,
  accountType,
  empty,
}: {
  title: string;
  items: BrandInquiryData[];
  accountType: "creator" | "brand";
  empty: string;
}) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{title}</p>
        <Badge tone="neutral" className="min-h-6 px-2 py-0.5 text-[11px]">
          {items.length}
        </Badge>
      </div>
      <div className="mt-3 grid gap-2">
        {items.length ? (
          items.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              href={collaborationDetailsHref(item.id)}
              className="focus-ring flex min-w-0 items-start justify-between gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] px-3 py-2 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{displayName(item, accountType)}</span>
                <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{item.timeline}</span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-cyan-100">{collaborationStatusLabel(item.status)}</span>
            </Link>
          ))
        ) : (
          <p className="rounded-[8px] border border-dashed border-white/10 px-3 py-4 text-sm leading-6 text-[var(--text-secondary)]">{empty}</p>
        )}
      </div>
    </div>
  );
}

export function WorkingHistoryCard({ accountType, collaborations = [], summary, showDetails = true, className }: WorkingHistoryCardProps) {
  const counts = summarize(collaborations, summary);
  const activeItems = bucketItems(collaborations, "active");
  const completedItems = bucketItems(collaborations, "completed");
  const declinedItems = bucketItems(collaborations, "declined");
  const partnerLabel = accountType === "creator" ? "Repeat brands" : "Repeat creators";

  return (
    <section className={cn("rounded-[8px] border border-white/10 bg-white/[0.04] p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Working History</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Collaboration record</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Completed work, active collaboration loops, and declined opportunities stay visible here.
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <History size={20} />
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Active collaborations", value: counts.active, Icon: BriefcaseBusiness, tone: "violet" as const },
          { label: "Completed collaborations", value: counts.completed, Icon: CheckCircle2, tone: "green" as const },
          { label: "Declined collaborations", value: counts.declined, Icon: XCircle, tone: "neutral" as const },
        ].map(({ label, value, Icon, tone }) => (
          <div key={label} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{value}</p>
              <Icon size={17} className={tone === "green" ? "text-emerald-200" : tone === "violet" ? "text-violet-200" : "text-[var(--text-muted)]"} />
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span className="text-[var(--text-secondary)]">Completed count</span>
          <Badge tone="green">{counts.completed}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span className="text-[var(--text-secondary)]">{partnerLabel}</span>
          <Badge tone="neutral">
            <RotateCcw size={12} />
            Placeholder
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span className="text-[var(--text-secondary)]">Completion rate</span>
          <Badge tone="neutral">Placeholder</Badge>
        </div>
      </div>

      {showDetails ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <HistoryList title="Active" items={activeItems} accountType={accountType} empty="No active collaborations yet." />
          <HistoryList title="Completed" items={completedItems} accountType={accountType} empty="Completed collaborations will appear here." />
          <HistoryList title="Declined" items={declinedItems} accountType={accountType} empty="Declined collaborations will appear here." />
        </div>
      ) : null}
    </section>
  );
}
