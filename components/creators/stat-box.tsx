import { type ReactNode } from "react";

type StatBoxProps = {
  label: string;
  value: string;
  badge?: ReactNode;
};

export function StatBox({ label, value, badge }: StatBoxProps) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[#0d0d14] p-3">
      <p className="font-mono text-lg font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
      {badge ? <div className="mt-2">{badge}</div> : null}
    </div>
  );
}
