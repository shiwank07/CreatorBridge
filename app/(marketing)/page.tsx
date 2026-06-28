import Link from "next/link";
import { ArrowRight, Building2, ListChecks, Search, Send, UserPlus } from "lucide-react";

import { FeaturedCreators } from "@/components/marketing/featured-creators";
import { LandingHero } from "@/components/marketing/landing-hero";
import { StatsBar } from "@/components/marketing/stats-bar";
import { Badge } from "@/components/shared/badge";
import { authHref } from "@/lib/auth-redirect";
import { NICHES } from "@/lib/constants";
import { getFeaturedCreators } from "@/lib/queries/creators";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredCreators = await getFeaturedCreators(6);

  return (
    <main>
      <LandingHero />
      <StatsBar />

      <section id="for-brands" className="bridge-section scroll-mt-24">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bridge-card bridge-card-hover p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-cyan-400/30 bg-[#0b0f16] text-[var(--cyan)]">
              <Building2 size={24} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">For Brands</h2>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              <li>1. Share your campaign brief and target creator profile.</li>
              <li>2. Browse creators by niche, platform, rate, and availability.</li>
              <li>3. Send an inquiry for admin review and outreach.</li>
            </ol>
            <Link href={authHref("/sign-up", "/onboarding?role=brand")} className="bridge-button-secondary mt-6">
              Create Brand Profile
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="bridge-card bridge-card-hover p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-emerald-400/30 bg-[#0b0f16] text-emerald-300">
              <UserPlus size={24} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">For Creators</h2>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              <li>1. Sign up with Clerk and complete creator onboarding.</li>
              <li>2. Publish your public profile with stats and sample work.</li>
              <li>3. Get discovered by brands looking for campaign partners.</li>
            </ol>
            <Link href={authHref("/sign-up", "/onboarding?role=creator")} className="bridge-button-primary mt-6">
              List Your Profile
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <FeaturedCreators creators={featuredCreators} />

      <section className="border-y border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
        <div className="bridge-section py-12 sm:py-14">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="bridge-eyebrow">Niche Categories</p>
              <h2 className="mt-3 font-display text-3xl font-bold">Find creators by audience fit</h2>
            </div>
            <Link href="/creators" className="bridge-button-primary">
              <Search size={16} />
              Search Directory
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {NICHES.map((niche) => (
              <Link key={niche} href={`/creators?niche=${encodeURIComponent(niche)}`}>
                <Badge tone="neutral" className="transition hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]">
                  {niche}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bridge-section scroll-mt-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { step: "Discover", icon: Search, copy: "Browse creator profiles with public stats, audience niches, and base rates." },
            { step: "Shortlist", icon: ListChecks, copy: "Compare creators by platform strength and campaign fit before reaching out." },
            { step: "Inquire", icon: Send, copy: "Submit a brand inquiry with the details needed for a useful first review." },
          ].map(({ step, icon: Icon, copy }, index) => (
            <div key={step} className="bridge-card bridge-card-hover p-6">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-[var(--cyan)]">0{index + 1}</p>
                <Icon size={20} className="text-[var(--text-muted)]" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{step}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-10 text-center">
          <h2 className="font-display text-3xl font-bold">Ready to grow?</h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={authHref("/sign-up", "/onboarding?role=creator")} className="bridge-button-primary">
              <UserPlus size={17} />
              List Your Profile Free
            </Link>
            <Link href="/campaign-inquiry" className="bridge-button-secondary">
              Post a Campaign Inquiry
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
