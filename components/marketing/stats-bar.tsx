const stats = [
  { label: "Creators", value: "2,400+" },
  { label: "Brands", value: "340+" },
  { label: "Deals Closed", value: "Rs. 2.1Cr+" },
  { label: "Niches", value: "12" },
];

export function StatsBar() {
  return (
    <section className="border-y border-[var(--border)] bg-[#0d0d14]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="px-3 py-4 text-center">
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
