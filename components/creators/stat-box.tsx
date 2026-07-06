import { type ReactNode } from "react";

type StatBoxProps = {
  label: string;
  value: string;
  badge?: ReactNode;
  muted?: boolean;
};

export function StatBox({ label, value, badge, muted = false }: StatBoxProps) {
  return (
    <div className="bridge-panel min-h-[86px] min-w-0 p-3">
      <p className={`${muted ? "text-sm font-semibold leading-5 text-cyan-100" : "font-mono text-lg font-bold text-[var(--text-primary)]"} break-words`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
      {badge ? <div className="mt-2">{badge}</div> : null}
    </div>
  );
}
