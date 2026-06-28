import { type ReactNode } from "react";

type StatBoxProps = {
  label: string;
  value: string;
  badge?: ReactNode;
};

export function StatBox({ label, value, badge }: StatBoxProps) {
  return (
    <div className="bridge-panel min-h-[86px] p-3">
      <p className="truncate font-mono text-lg font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
      {badge ? <div className="mt-2">{badge}</div> : null}
    </div>
  );
}
