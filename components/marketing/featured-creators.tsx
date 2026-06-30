import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CreatorCard } from "@/components/creators/creator-card";
import { EmptyState } from "@/components/shared/empty-state";
import { authHref } from "@/lib/auth-redirect";
import { type CreatorCardData } from "@/lib/types";

type FeaturedCreatorsProps = {
  creators: CreatorCardData[];
  viewerRole?: "creator" | "brand";
};

export function FeaturedCreators({ creators, viewerRole }: FeaturedCreatorsProps) {
  return (
    <section className="bridge-section">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="bridge-eyebrow">Featured Creators</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Creators brands can brief today</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Compare audience fit, creative niche, base rates, and availability before starting a collaboration request.
          </p>
        </div>
        <Link href="/creators" className="bridge-button-secondary w-full md:w-auto">
          Browse directory
          <ArrowRight size={16} />
        </Link>
      </div>

      {creators.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} viewerRole={viewerRole} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No featured creators yet"
            description="Once creators complete onboarding and an admin marks them featured, they will appear here."
            actionHref={viewerRole === "brand" ? undefined : authHref("/sign-up", "/onboarding?role=creator")}
            actionLabel={viewerRole === "brand" ? undefined : "Create Profile"}
          />
        </div>
      )}
    </section>
  );
}
