import { Filter, Search } from "lucide-react";

import { NICHES, PLATFORMS } from "@/lib/constants";

type CreatorDirectoryFiltersProps = {
  search?: string;
  niche?: string;
  platform?: string;
  country?: string;
  sort?: string;
  openToDeals?: boolean;
};

export function CreatorDirectoryFilters(props: CreatorDirectoryFiltersProps) {
  return (
    <form action="/creators" className="bridge-card p-4">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
        <Filter size={18} className="text-violet-300" />
        <h2 className="font-display text-lg font-bold">Find creators</h2>
      </div>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="bridge-label">Search</span>
          <span className="relative mt-2 block">
            <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-[var(--text-muted)]" />
            <input name="q" defaultValue={props.search} className="bridge-input pl-10" placeholder="Name, niche, username" />
          </span>
        </label>

        <label className="block">
          <span className="bridge-label">Niche</span>
          <select name="niche" defaultValue={props.niche ?? ""} className="bridge-input mt-2">
            <option value="">All niches</option>
            {NICHES.map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="bridge-label">Platform</span>
          <select name="platform" defaultValue={props.platform ?? ""} className="bridge-input mt-2">
            <option value="">All platforms</option>
            {PLATFORMS.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="bridge-label">Country</span>
          <input name="country" defaultValue={props.country} className="bridge-input mt-2" placeholder="India" />
        </label>

        <label className="block">
          <span className="bridge-label">Sort</span>
          <select name="sort" defaultValue={props.sort ?? "featured"} className="bridge-input mt-2">
            <option value="featured">Featured first</option>
            <option value="subscribers">Most subscribers</option>
            <option value="views">Most views</option>
            <option value="rate-low">Lowest rate</option>
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-[8px] border border-[var(--border)] bg-[#0d0d14] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <input name="open" type="checkbox" value="true" defaultChecked={props.openToDeals} className="h-4 w-4 accent-violet-600" />
          Open to deals only
        </label>

        <button
          type="submit"
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
        >
          <Search size={16} />
          Search Creators
        </button>
      </div>
    </form>
  );
}
