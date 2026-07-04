import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="bridge-card flex min-h-72 flex-col items-center justify-center px-5 py-10 text-center sm:px-6 sm:py-12">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_28px_rgba(103,232,249,0.12)]">
        <Inbox size={20} />
      </div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="bridge-button-secondary mt-6 w-full sm:w-auto"
        >
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}
