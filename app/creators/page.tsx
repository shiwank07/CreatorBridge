import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Home, Radar, Rocket, Sparkles, Zap } from "lucide-react";

import { CreatorCard } from "@/components/creators/creator-card";
import { CreatorDirectoryFilters } from "@/components/creators/creator-directory-filters";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { authHref } from "@/lib/auth-redirect";
import { formatNumber } from "@/lib/format";
import { platformDisplayName } from "@/lib/platforms";
import { getCreatorDiscoveryPage } from "@/lib/queries/creators";
import { getPublicSubscriberCount } from "@/lib/verification";
import { logServerTiming } from "@/lib/server-timing";
import { publicPageMetadata } from "@/lib/seo";
import { getApplicationAccountState } from "@/lib/application-account-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = publicPageMetadata(
  "Discover Verified Creators",
  "Browse verified creators by niche, platform, country, availability, audience, and collaboration fit on Branzzo.",
  "/creators",
);

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

export default async function CreatorsPage({ searchParams }: { searchParams: CreatorSearchParams }) {
  const renderStartedAt = performance.now();
  const params = await searchParams;
  const filters = {
    search: readParam(params.q),
    niche: readParam(params.niche),
    platform: readParam(params.platform),
    verification: readParam(params.verification) as "verified" | "unverified" | undefined,
    availability: readParam(params.availability) as "open" | "closed" | undefined,
    language: readParam(params.language),
    subscriberRange: readParam(params.subs),
    viewsRange: readParam(params.views),
    priceRange: readParam(params.price),
    engagementRange: readParam(params.engagement),
    country: readParam(params.country),
    sort: readParam(params.sort) ?? "featured",
    page: Math.max(Number.parseInt(readParam(params.page) ?? "1", 10) || 1, 1),
    pageSize: 24,
  };

  const [discovery, accountState] = await Promise.all([
    getCreatorDiscoveryPage(filters),
    getApplicationAccountState(),
  ]);
  const creators = discovery.creators;
  logServerTiming("server-render.total", performance.now() - renderStartedAt, { route: "/creators" });
  const verifiedCreators = creators.filter((creator) => creator.isVerified).length;
  const totalReach = creators.reduce((sum, creator) => sum + getPublicSubscriberCount(creator), 0);
  const activeFilters = [
    filters.search ? `Search: ${filters.search}` : "",
    filters.niche ? `Niche: ${filters.niche}` : "",
    filters.platform ? `Platform: ${platformDisplayName(filters.platform)}` : "",
    filters.subscriberRange ? subscriberRangeLabel(filters.subscriberRange) : "",
    filters.priceRange ? priceRangeLabel(filters.priceRange) : "",
    filters.country ? `Country: ${filters.country}` : "",
    filters.sort && filters.sort !== "featured" ? `Sort: ${filters.sort.replace("-", " ")}` : "",
  ].filter(Boolean);
  const pageHref = (page: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const normalized = Array.isArray(value) ? value[0] : value;
      if (normalized && key !== "page") next.set(key, normalized);
    }
    next.set("page", String(page));
    return `/creators?${next}`;
  };

  return (
    <>
      <MarketingNavbar />
      <main className="creator-directory-shell">
        <section className="creator-directory-hero relative overflow-hidden">
          <div className="creator-grid-field" />
          <div className="creator-aurora-field" />
          <div className="creator-particle creator-particle-a" />
          <div className="creator-particle creator-particle-b" />
          <div className="creator-particle creator-particle-c" />
          <div className="bridge-section relative py-12 sm:py-16 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
              <div>
                <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/10">
                  <Home size={15} />
                  Back to homepage
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100 shadow-[0_0_34px_rgba(124,58,237,0.24)]">
                  <Sparkles size={15} />
                  Verified creator intelligence
                </div>
                <h1 className="mt-6 max-w-4xl font-display text-4xl font-black leading-[1.05] text-white sm:text-5xl md:text-6xl xl:text-7xl">
                  Discover Verified Creators
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  Connect with trusted creators and launch high-performing campaigns through a premium discovery layer built for modern brands.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="#creator-search" className="bridge-button-primary w-full sm:w-auto">
                    Start Searching
                    <ArrowRight size={17} />
                  </Link>
                  <Link href={authHref("/sign-up", "/onboarding?role=brand")} className="bridge-button-secondary w-full sm:w-auto">
                    Join as Brand
                    <Rocket size={17} />
                  </Link>
                </div>
              </div>

              <div className="creator-command-panel animate-float-slow p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-cyan-200">Signal Console</p>
                    <p className="mt-1 font-display text-xl font-bold">Branzzo OS</p>
                  </div>
                  <Radar size={22} className="text-cyan-200" />
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { label: "Verified on this page", value: `${verifiedCreators}/${creators.length}`, icon: BadgeCheck },
                    { label: "Visible audience reach", value: formatNumber(totalReach), icon: Zap },
                    { label: "Brand-safe requests", value: "Manual review", icon: Building2 },
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
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="bridge-eyebrow">Creator Matrix</p>
              <h2 className="mt-3 font-display text-3xl font-black">Campaign-fit profiles</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Browse verified signals, platform fit, pricing, language coverage, and availability without leaving the discovery flow.
              </p>
            </div>
            <div className="creator-result-pill">
              <span className="font-mono text-xl font-bold text-white">
                {discovery.total}
              </span>
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

          {creators.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-testid="creator-grid">
              {creators.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator}
                  viewerState={
                    accountState.status === "anonymous"
                      ? "signed_out"
                      : accountState.status === "brand"
                        ? "brand"
                        : accountState.status === "creator"
                          ? accountState.username.toLowerCase() === creator.username.toLowerCase() ? "owner" : "creator"
                          : accountState.status === "admin"
                            ? "admin"
                            : accountState.status === "temporarily_unavailable"
                              ? "unavailable"
                              : "signed_in_unknown"
                  }
                />
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

          {discovery.total > 0 ? (
            <nav aria-label="Creator pagination" className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Page {discovery.page} of {discovery.totalPages} · {discovery.total} total results</p>
              <div className="flex gap-2">
                {discovery.page > 1 ? <Link href={pageHref(discovery.page - 1)} className="bridge-button-secondary px-4 py-2 text-sm">Previous</Link> : <button disabled className="bridge-button-secondary px-4 py-2 text-sm">Previous</button>}
                {discovery.page < discovery.totalPages ? <Link href={pageHref(discovery.page + 1)} className="bridge-button-secondary px-4 py-2 text-sm">Next</Link> : <button disabled className="bridge-button-secondary px-4 py-2 text-sm">Next</button>}
              </div>
            </nav>
          ) : null}

          {creators.length > 0 ? (
            <aside className="mt-14 border-t border-white/10 pt-8" aria-label="Current marketplace statistics">
              <p className="bridge-eyebrow">Current marketplace signals</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Matching creators", value: String(discovery.total), detail: "server-filtered results", icon: Sparkles },
                  { label: "Verified creators", value: String(verifiedCreators), detail: "approved platform ownership", icon: BadgeCheck },
                  { label: "Visible audience reach", value: formatNumber(totalReach), detail: "combined public subscriber count", icon: Zap },
                ].map(({ label, value, detail, icon: Icon }) => (
                  <div key={label} className="creator-stat-card">
                    <Icon size={19} className="text-cyan-200" />
                    <p className="mt-4 font-mono text-2xl font-bold text-white">{value}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{detail}</p>
                  </div>
                ))}
              </div>
            </aside>
          ) : null}
        </section>
      </main>
    </>
  );
}
