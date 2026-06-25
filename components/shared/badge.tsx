import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "violet" | "green" | "yellow" | "neutral";
  className?: string;
};

export function Badge({ children, tone = "violet", className }: BadgeProps) {
  const tones = {
    violet: "border-violet-800 bg-violet-950/70 text-violet-200",
    green: "border-emerald-800 bg-emerald-950/70 text-emerald-200",
    yellow: "border-yellow-700 bg-yellow-950/70 text-yellow-200",
    neutral: "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
