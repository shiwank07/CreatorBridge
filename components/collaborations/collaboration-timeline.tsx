import { Check } from "lucide-react";

import {
  COLLABORATION_TIMELINE_STEPS,
  collaborationStatusLabel,
  collaborationStatusIndex,
  collaborationTimelineEventLabel,
  normalizeCollaborationStatus,
} from "@/lib/collaborations";
import { type CollaborationTimelineEntryData } from "@/lib/types";
import { cn } from "@/lib/utils";

type CollaborationTimelineProps = {
  status?: string;
  history?: CollaborationTimelineEntryData[];
  compact?: boolean;
  className?: string;
};

function timelineDate(value?: string) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function actorLabel(actor?: string) {
  if (actor === "brand") return "Brand";
  if (actor === "creator") return "Creator";
  if (actor === "admin") return "Admin";
  return "System";
}

export function CollaborationTimeline({ status = "NEW", history = [], compact = false, className }: CollaborationTimelineProps) {
  const currentStatus = normalizeCollaborationStatus(status);
  const currentIndex = collaborationStatusIndex(currentStatus);

  if (compact) {
    return (
      <ol className={cn("flex items-center gap-3 flex-wrap", className)} aria-label={`Collaboration status: ${currentStatus.replaceAll("_", " ")}`}>
        {COLLABORATION_TIMELINE_STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isActive = index <= currentIndex;

          return (
            <li key={step.label} className="block">
              <div
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold leading-none",
                  isActive ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : "border-white/15 bg-black/20 text-[var(--text-secondary)]",
                  isComplete ? "border-emerald-300/45 bg-emerald-300/10 text-emerald-100" : "",
                  isCurrent ? "border-cyan-300/70 bg-cyan-300/20 text-cyan-50" : "",
                )}
              >
                <span className="block leading-none">{index + 1}</span>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className={cn("w-full", className)} aria-label={`Collaboration status: ${currentStatus.replaceAll("_", " ")}`}>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 xl:gap-2">
        {COLLABORATION_TIMELINE_STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isActive = index <= currentIndex;

          return (
            <li key={step.label} className="relative min-w-0">
              <div
                className={cn(
                  "flex h-full min-w-0 items-start gap-3 rounded-[8px] border px-3 py-3",
                  isActive
                    ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-50"
                    : "border-white/10 bg-white/[0.035] text-[var(--text-secondary)]",
                  isCurrent ? "shadow-[0_0_24px_rgba(103,232,249,0.13)]" : "",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold leading-none",
                    isActive ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : "border-white/15 bg-black/20",
                  )}
                >
                  {isComplete ? <Check size={13} /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold uppercase">{step.label}</span>
                  {!compact ? (
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{step.description}</span>
                  ) : null}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {history.length ? (
        <ol className="mt-5 grid gap-3">
          {history.map((entry, index) => (
            <li key={entry.id ?? `${entry.event}-${entry.createdAt ?? index}`} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{collaborationTimelineEventLabel(entry.event)}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                    {actorLabel(entry.actor)} - {entry.note || collaborationStatusLabel(entry.status)}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-[var(--text-muted)]">{timelineDate(entry.createdAt)}</time>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
