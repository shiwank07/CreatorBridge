import { NICHES } from "@/lib/constants";

const stats = [
  { label: "Creators", value: "Early Access", motionClass: "stat-delay-1" },
  { label: "Brands", value: "Launch Partners", motionClass: "stat-delay-2" },
  { label: "Requests", value: "Structured", motionClass: "stat-delay-3" },
  { label: "Niche Categories", value: String(NICHES.length), motionClass: "stat-delay-4" },
];

export function StatsBar() {
  return (
    <section className="border-y border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`animate-stat-up premium-stat-card px-3 py-4 text-center ${stat.motionClass}`}>
            <p className="break-words font-display text-xl font-bold leading-tight text-[var(--text-primary)] sm:text-2xl md:text-3xl">{stat.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
