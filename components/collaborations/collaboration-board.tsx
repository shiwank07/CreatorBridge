"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, CircleDollarSign, UserRound } from "lucide-react";

import { CollaborationActions } from "@/components/collaborations/collaboration-actions";
import { CollaborationTimeline } from "@/components/collaborations/collaboration-timeline";
import { Badge } from "@/components/shared/badge";
import { collaborationDetailsHref } from "@/lib/collaboration-routes";
import { collaborationStatusLabel } from "@/lib/collaborations";
import { formatINR } from "@/lib/format";
import { platformDisplayName } from "@/lib/platforms";
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

function platformLabel(platform: string, customPlatformName?: string) {
  return platformDisplayName(platform, customPlatformName);
}

function offerLabel(collaboration: BrandInquiryData) {
  return collaboration.currentOfferAmount ? formatINR(collaboration.currentOfferAmount) : "Exact offer not recorded";
}

export function CollaborationBoard({ columns, mode }: CollaborationBoardProps) {
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [expandedCard, setExpandedCard] = useState("");
  const [activeColumn, setActiveColumn] = useState(columns[0]?.title ?? "");
  const [isDesktopBoard, setIsDesktopBoard] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktopBoard(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const displayedColumns = isDesktopBoard
    ? columns
    : columns.filter((column) => column.title === activeColumn).slice(0, 1);

  return (
    <div data-testid="collaboration-board" className="max-w-full overflow-x-auto pb-2">
      <div className="mb-3 flex max-w-full snap-x gap-2 overflow-x-auto pb-1 lg:hidden">
        {columns.map((column) => (
          <button
            key={column.title}
            type="button"
            onClick={() => {
              setActiveColumn(column.title);
              setExpandedCard("");
            }}
            className={cn(
              "focus-ring flex shrink-0 snap-start items-center gap-2 rounded-[8px] border px-3 py-2 text-xs font-semibold",
              column.title === activeColumn
                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                : "border-white/10 bg-white/[0.035] text-[var(--text-secondary)]",
            )}
          >
            {column.title}
            <span className="rounded-full bg-black/30 px-2 py-0.5 font-mono">{column.items.length}</span>
          </button>
        ))}
      </div>
      {columns.length >= 4 ? (
        <p className="mb-3 hidden text-xs text-[var(--text-muted)] lg:block">
          Scroll horizontally to review every status column.
        </p>
      ) : null}
      <div
        className={cn(
          "grid min-w-0 gap-4 md:grid-cols-2",
          columns.length >= 4
            ? "lg:w-max lg:grid-flow-col lg:grid-cols-none lg:auto-cols-[minmax(20rem,22rem)]"
            : "xl:grid-cols-3",
        )}
      >
        {displayedColumns.map((column) => {
          const visibleCount = visibleCounts[column.title] ?? 5;
          const visibleItems = column.items.slice(0, visibleCount);

          return (
          <section
            key={column.title}
            data-testid="collaboration-column"
            className="min-w-0 max-w-full self-start rounded-[8px] border border-white/10 bg-white/[0.035] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="min-w-0 break-words font-display text-lg font-bold leading-6">{column.title}</h2>
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-xs text-[var(--text-secondary)]">
                {column.items.length}
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {column.items.length > 0 ? (
                visibleItems.map((collaboration) => {
                  const cardKey = `${column.title}:${collaboration.id}`;
                  const isExpanded = expandedCard === cardKey;

                  return (
                  <article
                    key={collaboration.id}
                    data-testid="collaboration-card"
                    className="min-w-0 max-w-full overflow-hidden rounded-[8px] border border-[var(--border)] bg-[#0b0f16] p-4"
                  >
                    <Link href={collaborationDetailsHref(collaboration.id)} className="focus-ring block rounded-[8px] transition hover:bg-white/[0.025]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-[var(--text-primary)]">{collaboration.companyName}</h3>
                          <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                            {collaboration.creatorUsername ? `@${collaboration.creatorUsername}` : "Open creator brief"}
                          </p>
                        </div>
                        <Badge tone={collaboration.status === "DECLINED" || collaboration.status === "CANCELLED" ? "neutral" : "green"} className="max-w-[9rem] shrink-0">
                          {collaborationStatusLabel(collaboration.status)}
                        </Badge>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{collaboration.campaignGoal}</p>

                      <div className="mt-4 grid gap-2 text-xs text-[var(--text-secondary)]">
                        <span className="flex min-w-0 items-center gap-2">
                          <CircleDollarSign size={14} className="shrink-0 text-cyan-200" />
                          <span className="truncate">{offerLabel(collaboration)}</span>
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

                    </Link>

                    <details
                      open={isExpanded}
                      data-testid="collaboration-workflow"
                      className="group mt-4 border-t border-white/10 pt-3"
                      onToggle={(event) => {
                        const isOpen = event.currentTarget.open;
                        setExpandedCard((current) =>
                          isOpen ? cardKey : current === cardKey ? "" : current,
                        );
                      }}
                    >
                      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-[8px] px-2 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/10">
                        View workflow and actions
                        <ChevronDown size={15} className="shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      {isExpanded ? <div className="min-w-0 pt-2">
                        {collaboration.deliverables.length > 0 || collaboration.targetPlatforms.length > 0 ? (
                          <div className="flex min-w-0 flex-wrap gap-2">
                            {[
                              ...collaboration.deliverables.slice(0, 2),
                              ...collaboration.targetPlatforms.slice(0, 2).map((platform) => platformLabel(platform, collaboration.customPlatformName)),
                            ].map((item) => (
                              <span key={item} className="max-w-full break-words rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] leading-4 text-[var(--text-secondary)]">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {collaboration.creatorResponseNote ? (
                          <div className="mt-3 rounded-[8px] border border-white/10 bg-white/[0.035] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
                            <span className="font-semibold text-[var(--text-primary)]">Creator response:</span> {collaboration.creatorResponseNote}
                          </div>
                        ) : null}

                        <CollaborationTimeline status={collaboration.status} compact className="mt-3" />
                        {mode ? <CollaborationActions collaboration={collaboration} mode={mode} /> : null}
                        {collaboration.website ? (
                          <Link href={collaboration.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-semibold text-cyan-200 hover:text-cyan-100">
                            Brand website
                          </Link>
                        ) : null}
                      </div> : null}
                    </details>
                  </article>
                  );
                })
              ) : (
                <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-8 text-center text-sm leading-6 text-[var(--text-secondary)]">
                  No collaborations in this stage.
                </div>
              )}
              {visibleCount < column.items.length ? (
                <button
                  type="button"
                  className="bridge-button-secondary w-full px-3 py-2 text-xs"
                  onClick={() =>
                    setVisibleCounts((current) => ({
                      ...current,
                      [column.title]: Math.min(visibleCount + 5, column.items.length),
                    }))
                  }
                >
                  Show 5 more
                </button>
              ) : null}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}
