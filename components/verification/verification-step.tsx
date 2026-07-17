"use client";

import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import Link from "next/link";

type VerificationStepProps = {
  index: number;
  label: string;
  detail: string;
  done: boolean;
  current?: boolean;
  href?: string;
  targetId?: string;
  focusId?: string;
};

export function VerificationStep({ index, label, detail, done, current, href, targetId, focusId }: VerificationStepProps) {
  const Icon = done ? CheckCircle2 : current ? Clock3 : Circle;
  const iconClass = done ? "text-emerald-200" : current ? "text-yellow-200" : "text-[var(--text-muted)]";
  const content = (
    <>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-xs font-bold text-[var(--text-secondary)]">
        {index + 1}
      </span>
      <Icon size={18} className={`mt-1 shrink-0 ${iconClass}`} />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{detail}</span>
      </span>
    </>
  );
  const className = "focus-ring flex w-full min-w-0 items-start gap-3 rounded-[8px] border border-white/10 bg-black/20 p-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]";

  if (href) return <Link href={href} className={className}>{content}</Link>;
  if (targetId) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
          window.setTimeout(() => document.getElementById(focusId ?? "")?.focus({ preventScroll: true }), 450);
        }}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
