import Link from "next/link";
import { CalendarDays, CircleDollarSign, UserRound } from "lucide-react";

import { CollaborationActions } from "@/components/collaborations/collaboration-actions";
import { CollaborationTimeline } from "@/components/collaborations/collaboration-timeline";
import { Badge } from "@/components/shared/badge";
import { collaborationStatusLabel } from "@/lib/collaborations";
import { type BrandInquiryData } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CollaborationBoardColumn = {
  title: string;
  items: BrandInquiryData[];
};

type CollaborationBoardProps = {
  columns: CollaborationBoardColumn[];
  mode?: "creator" | "brand";
};

function collaborationDate(value?: string) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function platformLabel(platform: string) {
  return platform.replaceAll("_", " ");
}

export function CollaborationBoard({ columns, mode }: CollaborationBoardProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", columns.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4")}>
      {columns.map((column) => (
        <section key={column.title} className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">{column.title}</h2>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-xs text-[var(--text-secondary)]">
              {column.items.length}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {column.items.length > 0 ? (
              column.items.map((collaboration) => (
                <article key={collaboration.id} className="rounded-[8px] border border-[var(--border)] bg-[#0b0f16] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-[var(--text-primary)]">{collaboration.companyName}</h3>
                      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                        {collaboration.creatorUsername ? `@${collaboration.creatorUsername}` : "Open creator brief"}
                      </p>
                    </div>
                    <Badge tone={collaboration.status === "closed" ? "neutral" : "green"} className="shrink-0">
                      {collaborationStatusLabel(collaboration.status)}
                    </Badge>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{collaboration.campaignGoal}</p>

                  <div className="mt-4 grid gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="flex min-w-0 items-center gap-2">
                      <CircleDollarSign size={14} className="shrink-0 text-cyan-200" />
                      <span className="truncate">{collaboration.budgetRange}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <CalendarDays size={14} className="shrink-0 text-violet-200" />
                      <span className="truncate">{collaboration.timeline}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <UserRound size={14} className="shrink-0 text-emerald-200" />
                      <span className="truncate">{collaborationDate(collaboration.createdAt)}</span>
                    </span>
                  </div>

                  {collaboration.deliverables.length > 0 || collaboration.targetPlatforms.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[...collaboration.deliverables.slice(0, 2), ...collaboration.targetPlatforms.slice(0, 2).map(platformLabel)].map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {collaboration.creatorResponseNote ? (
                    <div className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.035] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">Creator response:</span> {collaboration.creatorResponseNote}
                    </div>
                  ) : null}

                  <CollaborationTimeline status={collaboration.status} compact className="mt-4" />

                  {mode ? <CollaborationActions collaboration={collaboration} mode={mode} /> : null}

                  {collaboration.website ? (
                    <Link href={collaboration.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-semibold text-cyan-200 hover:text-cyan-100">
                      Brand website
                    </Link>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-8 text-center text-sm leading-6 text-[var(--text-secondary)]">
                No collaborations in this stage.
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
