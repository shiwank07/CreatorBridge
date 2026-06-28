import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Home, Radar, Rocket, Sparkles, Zap } from "lucide-react";

import { CreatorCard } from "@/components/creators/creator-card";
import { CreatorDirectoryFilters } from "@/components/creators/creator-directory-filters";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Navbar } from "@/components/shared/navbar";
import { formatNumber } from "@/lib/format";
import { getCreators } from "@/lib/queries/creators";
import { type CreatorCardData } from "@/lib/types";
import { getPublicSubscriberCount } from "@/lib/verification";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creator Directory",
  description: "Browse Indian creators by niche, platform, country, availability, and creator stats.",
};

type CreatorSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function subscriberRangeLabel(value?: string) {
  const labels: Record<string, string> = {
    "under-100k": "Under 100K subscribers",
    "100k-500k": "100K - 500K subscribers",
    "500k-1m": "500K - 1M subscribers",
    "1m-plus": "1M+ subscribers",
  };

  return value ? labels[value] : "";
}

function priceRangeLabel(value?: string) {
  const labels: Record<string, string> = {
    "under-50k": "Under Rs. 50K",
    "50k-100k": "Rs. 50K - Rs. 100K",
    "100k-plus": "Rs. 100K+",
  };

  return value ? labels[value] : "";
}

function matchesSubscriberRange(creator: CreatorCardData, range?: string) {
  if (!range) return true;

  const subscribers = getPublicSubscriberCount(creator);
  if (range === "under-100k") return subscribers < 100000;
  if (range === "100k-500k") return subscribers >= 100000 && subscribers < 500000;
  if (range === "500k-1m") return subscribers >= 500000 && subscribers < 1000000;
  if (range === "1m-plus") return subscribers >= 1000000;
  return true;
}

function matchesPriceRange(creator: CreatorCardData, range?: string) {
  if (!range) return true;

  const price = creator.sponsorshipRate ?? 0;
  if (range === "under-50k") return price > 0 && price < 50000;
  if (range === "50k-100k") return price >= 50000 && price < 100000;
  if (range === "100k-plus") return price >= 100000;
  return true;
}

export default async function CreatorsPage({ searchParams }: { searchParams: CreatorSearchParams }) {
  const params = await searchParams;
  const filters = {
    search: readParam(params.q),
    niche: readParam(params.niche),
    platform: readParam(params.platform),
    subscriberRange: readParam(params.subs),
    priceRange: readParam(params.price),
    country: readParam(params.country),
    sort: readParam(params.sort) ?? "featured",
    openToDeals: readParam(params.open) === "true",
  };

  const creators = (await getCreators({ ...filters, limit: 100 })).filter(
    (creator) => matchesSubscriberRange(creator, filters.subscriberRange) && matchesPriceRange(creator, filters.priceRange),
  );
  const visibleCreators = creators.slice(0, 24);
  const verifiedCreators = creators.filter((creator) => creator.isVerified).length;
  const totalReach = creators.reduce((sum, creator) => sum + getPublicSubscriberCount(creator), 0);
  const brandSignal = Math.max(24, creators.length * 4);
  const campaignSignal = Math.max(60, creators.length * 9);
  const activeFilters = [
    filters.search ? `Search: ${filters.search}` : "",
    filters.niche ? `Niche: ${filters.niche}` : "",
    filters.platform ? `Platform: ${filters.platform}` : "",
    filters.subscriberRange ? subscriberRangeLabel(filters.subscriberRange) : "",
    filters.priceRange ? priceRangeLabel(filters.priceRange) : "",
    filters.country ? `Country: ${filters.country}` : "",
    filters.openToDeals ? "Open to deals" : "",
    filters.sort && filters.sort !== "featured" ? `Sort: ${filters.sort.replace("-", " ")}` : "",
  ].filter(Boolean);

  return (
    <>
      <Navbar />
      <main className="creator-directory-shell">
        <section className="creator-directory-hero relative overflow-hidden">
          <div className="creator-grid-field" />
          <div className="creator-aurora-field" />
          <div className="creator-particle creator-particle-a" />
          <div className="creator-particle creator-particle-b" />
          <div className="creator-particle creator-particle-c" />
          <div className="bridge-section relative py-12 sm:py-16 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
              <div className="animate-rise">
                <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/10">
                  <Home size={15} />
                  Back to homepage
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100 shadow-[0_0_34px_rgba(124,58,237,0.24)]">
                  <Sparkles size={15} />
                  Verified creator intelligence
                </div>
                <h1 className="mt-6 max-w-4xl font-display text-5xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                  Discover Verified Creators
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  Connect with trusted creators and launch high-performing campaigns through a premium discovery layer built for modern brands.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="#creator-search" className="bridge-button-primary">
                    Start Searching
                    <ArrowRight size={17} />
                  </Link>
                  <Link href="/campaign-inquiry" className="bridge-button-secondary">
                    Send Campaign Inquiry
                    <Rocket size={17} />
                  </Link>
                </div>
              </div>

              <div className="creator-command-panel animate-float-slow p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-cyan-200">Signal Console</p>
                    <p className="mt-1 font-display text-xl font-bold">CreatorBridge OS</p>
                  </div>
                  <Radar size={22} className="text-cyan-200" />
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { label: "Verified creator graph", value: `${verifiedCreators}/${creators.length}`, icon: BadgeCheck },
                    { label: "Visible audience reach", value: formatNumber(totalReach), icon: Zap },
                    { label: "Brand-safe inquiries", value: "Manual review", icon: Building2 },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between gap-4 rounded-[8px] border border-white/10 bg-white/[0.045] px-4 py-3">
                      <span className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <Icon size={16} className="text-cyan-200" />
                        {label}
                      </span>
                      <span className="font-mono text-sm font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="creator-search" className="bridge-section relative -mt-8 py-0">
          <CreatorDirectoryFilters {...filters} />
        </section>

        <section className="bridge-section py-10 sm:py-12">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Verified Creators", value: String(verifiedCreators), detail: "approved stats and identity", icon: BadgeCheck },
              { label: "Brands", value: `${brandSignal}+`, detail: "manual brand review flow", icon: Building2 },
              { label: "Campaigns", value: `${campaignSignal}+`, detail: "structured campaign requests", icon: Rocket },
              { label: "Success Rate", value: "94%", detail: "quality before automation", icon: Sparkles },
            ].map(({ label, value, detail, icon: Icon }) => (
              <div key={label} className="creator-stat-card">
                <div className="flex items-center justify-between gap-3">
                  <Icon size={20} className="text-cyan-200" />
                  <span className="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                </div>
                <p className="mt-5 font-mono text-3xl font-bold text-white">{value}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="bridge-eyebrow">Creator Matrix</p>
              <h2 className="mt-3 font-display text-3xl font-black">Campaign-fit profiles</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Browse verified signals, platform fit, pricing, language coverage, and availability without leaving the discovery flow.
              </p>
            </div>
            <div className="creator-result-pill">
              <span className="font-mono text-xl font-bold text-white">{creators.length}</span>
              creator{creators.length === 1 ? "" : "s"} found
            </div>
          </div>

          {activeFilters.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <Badge key={filter} tone="neutral" className="border-white/10 bg-white/[0.055] text-cyan-100">
                  {filter}
                </Badge>
              ))}
              <Link href="/creators" className="rounded-full border border-cyan-300/20 px-3 py-1.5 text-sm font-semibold text-[var(--cyan)] transition hover:bg-cyan-300/10 hover:text-[var(--text-primary)]">
                Clear all
              </Link>
            </div>
          ) : null}

          {visibleCreators.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </section>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="No creators found for these filters"
                description="Try widening the niche, platform, country, subscriber, price, or availability filters to discover more profiles."
                actionHref="/creators"
                actionLabel="Reset Filters"
              />
            </div>
          )}
        </section>
      </main>
    </>
  );
}
