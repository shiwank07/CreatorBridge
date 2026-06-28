import Link from "next/link";
import { BadgeDollarSign, Filter, Globe2, Layers3, RadioTower, RotateCcw, Search, SlidersHorizontal, TrendingUp } from "lucide-react";

import { NICHES, PLATFORMS } from "@/lib/constants";

type CreatorDirectoryFiltersProps = {
  search?: string;
  niche?: string;
  platform?: string;
  subscriberRange?: string;
  priceRange?: string;
  country?: string;
  sort?: string;
  openToDeals?: boolean;
};

export function CreatorDirectoryFilters(props: CreatorDirectoryFiltersProps) {
  const hasFilters = Boolean(
    props.search ||
      props.niche ||
      props.platform ||
      props.subscriberRange ||
      props.priceRange ||
      props.country ||
      props.openToDeals ||
      (props.sort && props.sort !== "featured"),
  );

  return (
    <form action="/creators" method="get" className="creator-search-console p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
            <Filter size={18} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-200">Search Console</p>
            <h2 className="font-display text-xl font-bold">Find campaign-ready creators</h2>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
          <SlidersHorizontal size={15} className="text-violet-200" />
          Live filters
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="creator-filter-field md:col-span-2">
          <span className="creator-filter-label">Global creator search</span>
          <span className="relative mt-2 block">
            <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-cyan-200/70" />
            <input name="q" defaultValue={props.search} className="creator-filter-input pl-10" placeholder="Name, niche, username" />
          </span>
        </label>

        <label className="creator-filter-field">
          <span className="creator-filter-label">Niche</span>
          <span className="relative mt-2 block">
            <Layers3 size={16} className="pointer-events-none absolute left-3 top-3.5 text-violet-200/70" />
            <select name="niche" defaultValue={props.niche ?? ""} className="creator-filter-input pl-10">
            <option value="">All niches</option>
            {NICHES.map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
            </select>
          </span>
        </label>

        <label className="creator-filter-field">
          <span className="creator-filter-label">Platform</span>
          <span className="relative mt-2 block">
            <RadioTower size={16} className="pointer-events-none absolute left-3 top-3.5 text-cyan-200/70" />
            <select name="platform" defaultValue={props.platform ?? ""} className="creator-filter-input pl-10">
            <option value="">All platforms</option>
            {PLATFORMS.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
            </select>
          </span>
        </label>

        <label className="creator-filter-field">
          <span className="creator-filter-label">Subscriber range</span>
          <span className="relative mt-2 block">
            <TrendingUp size={16} className="pointer-events-none absolute left-3 top-3.5 text-emerald-200/70" />
            <select name="subs" defaultValue={props.subscriberRange ?? ""} className="creator-filter-input pl-10">
              <option value="">Any audience</option>
              <option value="under-100k">Under 100K</option>
              <option value="100k-500k">100K - 500K</option>
              <option value="500k-1m">500K - 1M</option>
              <option value="1m-plus">1M+</option>
            </select>
          </span>
        </label>

        <label className="creator-filter-field">
          <span className="creator-filter-label">Price range</span>
          <span className="relative mt-2 block">
            <BadgeDollarSign size={16} className="pointer-events-none absolute left-3 top-3.5 text-yellow-200/70" />
            <select name="price" defaultValue={props.priceRange ?? ""} className="creator-filter-input pl-10">
              <option value="">Any starting price</option>
              <option value="under-50k">Under Rs. 50K</option>
              <option value="50k-100k">Rs. 50K - Rs. 100K</option>
              <option value="100k-plus">Rs. 100K+</option>
            </select>
          </span>
        </label>

        <label className="creator-filter-field">
          <span className="creator-filter-label">Country</span>
          <span className="relative mt-2 block">
            <Globe2 size={16} className="pointer-events-none absolute left-3 top-3.5 text-cyan-200/70" />
            <input name="country" defaultValue={props.country} className="creator-filter-input pl-10" placeholder="India" />
          </span>
        </label>

        <label className="creator-filter-field">
          <span className="creator-filter-label">Sort</span>
          <select name="sort" defaultValue={props.sort ?? "featured"} className="creator-filter-input mt-2">
            <option value="featured">Featured first</option>
            <option value="subscribers">Most subscribers</option>
            <option value="views">Most views</option>
            <option value="rate-low">Lowest rate</option>
            <option value="rate-high">Highest rate</option>
            <option value="newest">Newest profiles</option>
          </select>
        </label>

        <label className="creator-filter-toggle md:self-end">
          <input name="open" type="checkbox" value="true" defaultChecked={props.openToDeals} className="h-4 w-4 accent-violet-500" />
          Open to deals
        </label>

        <button
          type="submit"
          className="bridge-button-primary min-h-12 w-full md:self-end"
        >
          <Search size={16} />
          Search Creators
        </button>
        {hasFilters ? (
          <Link href="/creators" className="bridge-button-secondary min-h-12 w-full md:self-end">
            <RotateCcw size={16} />
            Reset Filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
