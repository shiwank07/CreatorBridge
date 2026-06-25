import type { Metadata } from "next";

import { CreatorCard } from "@/components/creators/creator-card";
import { CreatorDirectoryFilters } from "@/components/creators/creator-directory-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { getCreators } from "@/lib/queries/creators";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creator Directory",
  description: "Browse Indian creators by niche, platform, country, availability, and creator stats.",
};

type CreatorSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CreatorsPage({ searchParams }: { searchParams: CreatorSearchParams }) {
  const params = await searchParams;
  const filters = {
    search: readParam(params.q),
    niche: readParam(params.niche),
    platform: readParam(params.platform),
    country: readParam(params.country),
    sort: readParam(params.sort) ?? "featured",
    openToDeals: readParam(params.open) === "true",
    limit: 24,
  };

  const creators = await getCreators(filters);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-violet-300">Creator Directory</p>
          <h1 className="mt-3 font-display text-4xl font-black">Browse creators by fit</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Search public creator profiles by niche, platform, availability, location, and campaign-ready stats.
          </p>
        </div>
        <p className="rounded-[8px] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          {creators.length} creator{creators.length === 1 ? "" : "s"} found
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CreatorDirectoryFilters {...filters} />
        </aside>

        {creators.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </section>
        ) : (
          <EmptyState
            title="No creators found for these filters"
            description="Try widening the niche, platform, country, or availability filters to discover more profiles."
            actionHref="/creators"
            actionLabel="Reset Filters"
          />
        )}
      </div>
    </main>
  );
}
