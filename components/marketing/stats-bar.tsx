const stats = [
  { label: "Creator profiles", value: "2,400+" },
  { label: "Brand teams", value: "340+" },
  { label: "Campaign value", value: "Rs. 2.1Cr+" },
  { label: "Niche filters", value: "12" },
];

export function StatsBar() {
  return (
    <section className="border-y border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="px-3 py-4 text-center">
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)] md:text-3xl">{stat.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
