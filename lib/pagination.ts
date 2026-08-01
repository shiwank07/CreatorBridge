export const DEFAULT_PAGE_LIMIT = 30;
export const MAX_PAGE_LIMIT = 50;

export type PageRequest = {
  page?: number;
  limit?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function normalizePageRequest(request: PageRequest, total: number) {
  const requestedLimit = Number.isFinite(request.limit) ? Math.trunc(request.limit!) : DEFAULT_PAGE_LIMIT;
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, requestedLimit));
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const rawPage = Number.isFinite(request.page) ? Math.trunc(request.page!) : 1;
  const requestedPage = Math.max(1, rawPage);
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
  return { page, limit, totalPages, skip: (page - 1) * limit };
}

export function pageResult<T>(data: T[], request: PageRequest, total: number): PaginatedResult<T> {
  const { page, limit, totalPages } = normalizePageRequest(request, total);
  return {
    items: data,
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

export function parsePageSearchParams(params: Record<string, string | string[] | undefined>): PageRequest {
  const value = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  return {
    page: Number(value("page") ?? 1),
    limit: Number(value("limit") ?? DEFAULT_PAGE_LIMIT),
  };
}
