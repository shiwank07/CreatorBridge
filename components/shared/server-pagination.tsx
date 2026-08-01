import Link from "next/link";

import { type PaginatedResult } from "@/lib/pagination";

export function ServerPagination<T>({
  pagination,
  pathname,
  searchParams = {},
}: {
  pagination: PaginatedResult<T>;
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (pagination.totalPages <= 1) return null;
  const href = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, raw] of Object.entries(searchParams)) {
      const value = Array.isArray(raw) ? raw[0] : raw;
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", String(page));
    params.set("limit", String(pagination.limit));
    return `${pathname}?${params.toString()}`;
  };
  const visible = Array.from({ length: pagination.totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pagination.totalPages || Math.abs(value - pagination.page) <= 1,
  );
  const first = (pagination.page - 1) * pagination.limit + 1;
  const last = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <nav aria-label="List pagination" className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="text-sm text-[var(--text-secondary)]">Showing {first}–{last} of {pagination.total}</p>
      <div className="flex items-center gap-2">
        {pagination.hasPreviousPage ? <Link className="bridge-button-secondary px-3 py-2 text-sm" href={href(pagination.page - 1)}>Previous</Link> : <button disabled className="bridge-button-secondary px-3 py-2 text-sm">Previous</button>}
        <span className="px-1 text-sm text-[var(--text-secondary)] sm:hidden">Page {pagination.page} of {pagination.totalPages}</span>
        <div className="hidden items-center gap-1 sm:flex">
          {visible.map((value, index) => (
            <span key={value} className="contents">
              {index > 0 && value - visible[index - 1] > 1 ? <span aria-hidden="true" className="px-1">…</span> : null}
              {value === pagination.page ? (
                <span aria-current="page" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[8px] bg-violet-700 px-2 text-sm text-white">{value}</span>
              ) : (
                <Link aria-label={`Page ${value}`} className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center rounded-[8px] px-2 text-sm text-[var(--text-secondary)]" href={href(value)}>{value}</Link>
              )}
            </span>
          ))}
        </div>
        {pagination.hasNextPage ? <Link className="bridge-button-secondary px-3 py-2 text-sm" href={href(pagination.page + 1)}>Next</Link> : <button disabled className="bridge-button-secondary px-3 py-2 text-sm">Next</button>}
      </div>
    </nav>
  );
}
