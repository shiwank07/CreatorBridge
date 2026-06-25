import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CreatorCard } from "@/components/creators/creator-card";
import { EmptyState } from "@/components/shared/empty-state";
import { type CreatorCardData } from "@/lib/types";

type FeaturedCreatorsProps = {
  creators: CreatorCardData[];
};

export function FeaturedCreators({ creators }: FeaturedCreatorsProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-violet-300">Featured Creators</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Creators brands can brief today</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Compare audience fit, creative niche, base rates, and availability before sending a campaign inquiry.
          </p>
        </div>
        <Link
          href="/creators"
          className="focus-ring inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
        >
          Browse directory
          <ArrowRight size={16} />
        </Link>
      </div>

      {creators.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No featured creators yet"
            description="Once creators complete onboarding and an admin marks them featured, they will appear here."
            actionHref="/onboarding"
            actionLabel="Create Profile"
          />
        </div>
      )}
    </section>
  );
}
