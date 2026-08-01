"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

type Option = { value: string; label: string };
export type AdminListSelect = {
  name: string;
  label: string;
  options: Option[];
};

type Props = {
  selects: AdminListSelect[];
  searchPlaceholder: string;
};

export function AdminListControls({ selects, searchPlaceholder }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const canonicalSearch = params.get("search") ?? "";
  const [search, setSearch] = useState(canonicalSearch);
  const searchTimer = useRef<number | undefined>(undefined);

  useEffect(() => setSearch(canonicalSearch), [canonicalSearch]);

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  function scheduleSearch(nextSearch: string) {
    setSearch(nextSearch);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const value = nextSearch.trim().slice(0, 120);
      if (value === canonicalSearch) return;
      if (value) next.set("search", value);
      else next.delete("search");
      next.delete("page");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    }, 350);
  }

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  const active = Boolean(canonicalSearch || selects.some((select) => params.get(select.name)));

  return (
    <section aria-label="List filters" className="bridge-card mb-5 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(3,minmax(9rem,auto))_auto]">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-[var(--text-muted)]" size={17} />
          <input
            type="search"
            value={search}
            maxLength={120}
            onChange={(event) => scheduleSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="bridge-input w-full pl-10"
          />
        </label>
        {selects.map((select) => (
          <label key={select.name} className="block">
            <span className="sr-only">{select.label}</span>
            <select
              aria-label={select.label}
              value={params.get(select.name) ?? ""}
              onChange={(event) => update(select.name, event.target.value)}
              className="bridge-input w-full"
            >
              <option value="">{select.label}: All</option>
              {select.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        ))}
        {active ? (
          <Link href={pathname} className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
            <X size={15} /> Clear
          </Link>
        ) : null}
      </div>
    </section>
  );
}
