import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CreatorCard } from "@/components/creators/creator-card";
import { EmptyState } from "@/components/shared/empty-state";
import { authHref } from "@/lib/auth-redirect";
import { type CreatorCardData } from "@/lib/types";

type FeaturedCreatorsProps = {
  creators: CreatorCardData[];
};

export function FeaturedCreators({ creators }: FeaturedCreatorsProps) {
  return (
    <section className="bridge-section">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="bridge-eyebrow">Featured Creators</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Creators brands can brief today</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Compare audience fit, creative niche, base rates, and availability before sending a campaign inquiry.
          </p>
        </div>
        <Link href="/creators" className="bridge-button-secondary">
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
            actionHref={authHref("/sign-up", "/onboarding?role=creator")}
            actionLabel="Create Profile"
          />
        </div>
      )}
    </section>
  );
}
