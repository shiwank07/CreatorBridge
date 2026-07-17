import Link from "next/link";
import { ArrowRight, CheckCircle2, Gauge, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type ProfileCompletionItem, type ProfileCompletionResult } from "@/lib/profile-completion";

type ProfileCompletionCardProps = {
  completion: ProfileCompletionResult;
  updateHref: string;
  className?: string;
};

const completedLabels: Record<string, string> = {
  email: "Email verified",
  photo: "Profile photo added",
  bio: "Bio added",
  categories: "Categories added",
  location: "Location added",
  pricing: "Pricing added",
  social: "Social link added",
  availability: "Availability set",
  portfolio: "Portfolio links added",
};

const remainingLabels: Record<string, string> = {
  email: "Email not verified",
  photo: "Profile photo missing",
  bio: "Bio missing",
  categories: "Categories missing",
  location: "Location missing",
  pricing: "Pricing not set",
  social: "Social link missing",
  availability: "Availability not set",
  portfolio: "Portfolio links missing",
};

function checklistLabel(item: ProfileCompletionItem, done: boolean) {
  return (done ? completedLabels : remainingLabels)[item.key] ?? item.label;
}

function ChecklistGroup({ title, items, done }: { title: string; items: ProfileCompletionItem[]; done: boolean }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{title}</p>
        <Badge tone={done ? "green" : "yellow"} className="min-h-6 px-2 py-0.5 text-[11px]">
          {items.length}
        </Badge>
      </div>
      <div className="mt-3 grid gap-1.5">
        {items.length ? (
          items.map((item) => {
            const Icon = done ? CheckCircle2 : XCircle;

            return (
              <div key={item.key} className="flex min-w-0 items-start gap-2 rounded-[8px] px-2 py-1.5">
                <Icon size={15} className={done ? "mt-0.5 shrink-0 text-emerald-300" : "mt-0.5 shrink-0 text-rose-300"} />
                <p className="min-w-0 text-sm leading-5 text-[var(--text-primary)]" title={item.helper}>
                  {checklistLabel(item, done)}
                </p>
              </div>
            );
          })
        ) : (
          <p className="px-2 py-1.5 text-sm leading-5 text-[var(--text-secondary)]">
            {done ? "No completed items yet." : "Everything important is complete."}
          </p>
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

      <div className="mt-5 grid gap-3">
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
