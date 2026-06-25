import Link from "next/link";
import { RotateCcw } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="bridge-card flex flex-col items-center px-6 py-12 text-center">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="focus-ring mt-6 inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
        >
          <RotateCcw size={16} />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
