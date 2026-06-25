import Link from "next/link";
import { ArrowRight, Building2, Search, UserPlus } from "lucide-react";

import { FeaturedCreators } from "@/components/marketing/featured-creators";
import { LandingHero } from "@/components/marketing/landing-hero";
import { StatsBar } from "@/components/marketing/stats-bar";
import { Badge } from "@/components/shared/badge";
import { NICHES } from "@/lib/constants";
import { getFeaturedCreators } from "@/lib/queries/creators";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredCreators = await getFeaturedCreators(6);

  return (
    <main>
      <LandingHero />
      <StatsBar />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bridge-card p-6">
            <Building2 size={28} className="text-violet-300" />
            <h2 className="mt-4 font-display text-2xl font-bold">For Brands</h2>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              <li>1. Share your campaign brief and target creator profile.</li>
              <li>2. Browse creators by niche, platform, rate, and availability.</li>
              <li>3. Send an inquiry for admin review and outreach.</li>
            </ol>
          </div>
          <div className="bridge-card p-6">
            <UserPlus size={28} className="text-emerald-300" />
            <h2 className="mt-4 font-display text-2xl font-bold">For Creators</h2>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              <li>1. Sign up with Clerk and complete creator onboarding.</li>
              <li>2. Publish your public profile with stats and sample work.</li>
              <li>3. Get discovered by brands looking for campaign partners.</li>
            </ol>
          </div>
        </div>
      </section>

      <FeaturedCreators creators={featuredCreators} />

      <section className="border-y border-[var(--border)] bg-[#0d0d14]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-violet-300">Niche Categories</p>
              <h2 className="mt-3 font-display text-3xl font-bold">Find creators by audience fit</h2>
            </div>
            <Link
              href="/creators"
              className="focus-ring inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              <Search size={16} />
              Search Directory
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {NICHES.map((niche) => (
              <Badge key={niche} tone="neutral">
                {niche}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {["Discover", "Shortlist", "Inquire"].map((step, index) => (
            <div key={step} className="bridge-card p-6">
              <p className="font-mono text-sm text-violet-300">0{index + 1}</p>
              <h3 className="mt-4 font-display text-xl font-bold">{step}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {index === 0
                  ? "Browse creator profiles with public stats, audience niches, and base rates."
                  : index === 1
                    ? "Compare creators by platform strength and campaign fit before reaching out."
                    : "Submit a brand inquiry with the details needed for a useful first review."}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-10 text-center">
          <h2 className="font-display text-3xl font-bold">Ready to grow?</h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
            >
              <UserPlus size={17} />
              List Your Profile Free
            </Link>
            <Link
              href="/campaign-inquiry"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)]"
            >
              Post a Campaign Inquiry
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
