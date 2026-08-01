"use client";

import { useEffect, useMemo, useState } from "react";

export const ADMIN_PAGE_SIZE = 30;

export function useAdminPagination<T>(items: T[], pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return { page, pageCount, pageItems, pageSize, setPage, total: items.length };
}

export function AdminPagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (total <= pageSize) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Table pagination"
      className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-[var(--text-secondary)]">
        Showing {first}-{last} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="bridge-button-secondary px-4 py-2 text-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="inline-flex min-h-10 items-center px-2 text-sm text-[var(--text-secondary)] sm:hidden">
          Page {page} of {pageCount}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: pageCount }, (_, index) => index + 1)
            .filter((value) => value === 1 || value === pageCount || Math.abs(value - page) <= 1)
            .map((value, index, visible) => (
              <span key={value} className="contents">
                {index > 0 && value - visible[index - 1] > 1 ? <span aria-hidden="true" className="px-1">…</span> : null}
                <button
                  type="button"
                  aria-label={`Page ${value}`}
                  aria-current={value === page ? "page" : undefined}
                  className={`focus-ring min-h-10 min-w-10 rounded-[8px] px-2 text-sm ${
                    value === page ? "bg-violet-700 text-white" : "text-[var(--text-secondary)]"
                  }`}
                  onClick={() => onPageChange(value)}
                >
                  {value}
                </button>
              </span>
            ))}
        </div>
        <button
          type="button"
          className="bridge-button-secondary px-4 py-2 text-sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
