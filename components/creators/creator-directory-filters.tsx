"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw, Search, X } from "lucide-react";

import { NICHES } from "@/lib/constants";

export type CreatorDirectoryFilterValues = {
  search?: string; niche?: string; platform?: string; verification?: string; availability?: string;
  country?: string; language?: string; subscriberRange?: string; viewsRange?: string;
  priceRange?: string; engagementRange?: string; sort?: string;
};

const options = {
  platform: [["", "All platforms"], ["youtube", "YouTube"], ["instagram", "Instagram"], ["twitch", "Twitch"], ["x", "X"], ["other", "Other"]],
  verification: [["", "Any verification"], ["verified", "Verified"], ["unverified", "Unverified"]],
  availability: [["", "Any availability"], ["open", "Open for collaborations"], ["closed", "Closed"]],
  subscriberRange: [["", "Any subscribers"], ["under-100k", "Under 100K"], ["100k-500k", "100K–500K"], ["500k-1m", "500K–1M"], ["1m-plus", "1M+"]],
  viewsRange: [["", "Any average views"], ["under-10k", "Under 10K"], ["10k-50k", "10K–50K"], ["50k-100k", "50K–100K"], ["100k-plus", "100K+"]],
  priceRange: [["", "Any starting price"], ["under-50k", "Under Rs. 50K"], ["50k-100k", "Rs. 50K–100K"], ["100k-plus", "Rs. 100K+"]],
  engagementRange: [["", "Any engagement"], ["under-5", "Under 5%"], ["5-10", "5%–10%"], ["10-plus", "10%+"]],
  sort: [["featured", "Featured"], ["newest", "Newest"], ["oldest", "Oldest"], ["subscribers", "Highest subscribers"], ["subscribers-low", "Lowest subscribers"], ["engagement-high", "Highest engagement"], ["rate-low", "Lowest price"], ["rate-high", "Highest price"], ["alphabetical", "Alphabetical A–Z"], ["alphabetical-desc", "Alphabetical Z–A"]],
} as const;

function SelectField({ label, name, value, values }: { label: string; name: string; value?: string; values: readonly (readonly [string, string])[] }) {
  return <label className="creator-filter-field"><span className="creator-filter-label">{label}</span><select name={name} defaultValue={value ?? ""} className="creator-filter-input mt-2">{values.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

export function CreatorDirectoryFilters(props: CreatorDirectoryFilterValues) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const [search, setSearch] = useState(props.search ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (search === (currentParams.get("q") ?? "")) return;
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(currentParams.toString());
      if (search.trim()) next.set("q", search.trim()); else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [currentParams, pathname, router, search]);

  const fields = (
    <>
      <label className="creator-filter-field md:col-span-2"><span className="creator-filter-label">Search creators</span><span className="relative mt-2 block"><Search size={16} className="absolute left-3 top-3.5 text-cyan-200/70" /><input name="q" value={search} onChange={(event) => setSearch(event.target.value)} className="creator-filter-input pl-10" placeholder="Name, username, platform, category, country" /></span></label>
      <SelectField label="Platform" name="platform" value={props.platform} values={options.platform} />
      <SelectField label="Verification" name="verification" value={props.verification} values={options.verification} />
      <SelectField label="Availability" name="availability" value={props.availability} values={options.availability} />
      <SelectField label="Category" name="niche" value={props.niche} values={[["", "All categories"], ...NICHES.map((value) => [value, value] as const)]} />
      <label className="creator-filter-field"><span className="creator-filter-label">Country</span><input name="country" defaultValue={props.country} className="creator-filter-input mt-2" placeholder="India" /></label>
      <label className="creator-filter-field"><span className="creator-filter-label">Language</span><input name="language" defaultValue={props.language} className="creator-filter-input mt-2" placeholder="English" /></label>
      <SelectField label="Subscribers" name="subs" value={props.subscriberRange} values={options.subscriberRange} />
      <SelectField label="Average views" name="views" value={props.viewsRange} values={options.viewsRange} />
      <SelectField label="Starting price" name="price" value={props.priceRange} values={options.priceRange} />
      <SelectField label="Engagement" name="engagement" value={props.engagementRange} values={options.engagementRange} />
      <SelectField label="Sort" name="sort" value={props.sort} values={options.sort} />
      <button type="submit" className="bridge-button-primary min-h-12 md:self-end"><Search size={16} />Apply filters</button>
      <Link href="/creators" className="bridge-button-secondary min-h-12 md:self-end"><RotateCcw size={16} />Reset</Link>
    </>
  );

  return (
    <>
      <button type="button" onClick={() => setMobileOpen(true)} className="bridge-button-secondary w-full md:hidden"><Filter size={17} />Open filters</button>
      <form action="/creators" className="creator-search-console hidden p-5 md:block"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{fields}</div></form>
      {mobileOpen ? <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm md:hidden"><form action="/creators" className="ml-auto h-full w-[min(92vw,390px)] overflow-y-auto border-l border-white/10 bg-[#090b12] p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Discovery filters</h2><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close filters" className="bridge-button-secondary p-2"><X size={18} /></button></div><div className="grid gap-3">{fields}</div></form></div> : null}
    </>
  );
}
