import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Gauge } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type ProfileCompletionResult } from "@/lib/profile-completion";

type ProfileCompletionCardProps = {
  completion: ProfileCompletionResult;
  updateHref: string;
  className?: string;
};

function ChecklistGroup({
  title,
  items,
  done,
}: {
  title: string;
  items: ProfileCompletionResult["items"];
  done: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{title}</p>
        <Badge tone={done ? "green" : "neutral"}>{items.length}</Badge>
      </div>
      <div className="mt-3 grid gap-2">
        {items.length ? (
          items.map((item) => {
            const Icon = done ? CheckCircle2 : Circle;

            return (
              <div key={item.key} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
                <div className="flex items-start gap-2">
                  <Icon size={16} className={done ? "mt-0.5 shrink-0 text-emerald-300" : "mt-0.5 shrink-0 text-[var(--text-muted)]"} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{item.helper}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-black/20 p-3 text-sm text-[var(--text-secondary)]">
            Nothing here right now.
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileCompletionCard({ completion, updateHref, className = "rounded-[8px] border border-white/10 bg-white/[0.04] p-5" }: ProfileCompletionCardProps) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Profile Completion</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Profile Completion {completion.percent}%</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {completion.completedCount} of {completion.totalCount} trust and profile signals are complete.
          </p>
        </div>
        <Gauge size={22} className="shrink-0 text-cyan-200" />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" aria-label={`Profile completion ${completion.percent}%`}>
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-emerald-300" style={{ width: `${completion.percent}%` }} />
      </div>

      <div className="mt-5 grid gap-5">
        <ChecklistGroup title="Completed" items={completion.completedItems} done />
        <ChecklistGroup title="Remaining" items={completion.remainingItems} done={false} />
      </div>

      <Link href={updateHref} className="bridge-button-secondary mt-5 w-full px-3 py-2 text-xs">
        Update profile
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}
