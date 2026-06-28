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
    <div className="bridge-card flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[#0b0f16] text-[var(--cyan)]">
        <RotateCcw size={20} />
      </div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="bridge-button-secondary mt-6"
        >
          <RotateCcw size={16} />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
