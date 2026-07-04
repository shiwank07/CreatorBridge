"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type AdminSearchResultData } from "@/lib/types";

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResultData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      setError("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        const result = (await response.json().catch(() => ({}))) as {
          results?: AdminSearchResultData[];
          error?: string;
        };

        if (!response.ok) {
          setError(result.error ?? "Search failed.");
          setResults([]);
          return;
        }

        setResults(result.results ?? []);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") setError("Search failed.");
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmedQuery]);

  return (
    <div className="relative" role="search">
      <div className="flex items-center gap-3 rounded-[8px] border border-[var(--border)] bg-white/[0.04] px-3 py-2">
        <Search size={17} className="shrink-0 text-[var(--text-secondary)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search users, creators, and brands"
          placeholder="Search users, creators, brands"
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
        {isLoading ? <Loader2 size={16} className="shrink-0 animate-spin text-violet-300" aria-label="Searching" /> : null}
      </div>

      {trimmedQuery.length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[#0d0d14] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          {error ? <p role="alert" className="px-4 py-3 text-sm text-red-200">{error}</p> : null}
          {!error && results.length === 0 && !isLoading ? (
            <p role="status" className="px-4 py-3 text-sm text-[var(--text-secondary)]">No matches found.</p>
          ) : null}
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.href}
              className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-sm last:border-b-0 hover:bg-white/[0.04]"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-[var(--text-primary)]">{result.title}</span>
                <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{result.subtitle}</span>
              </span>
              <Badge tone={result.status === "suspended" ? "yellow" : result.status === "verified" ? "green" : "neutral"}>
                {result.type}
              </Badge>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
