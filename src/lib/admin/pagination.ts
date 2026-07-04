export const ADMIN_PAGE_SIZE = 50;

// Some admin views aggregate over a full working set rather than a single page:
// the dashboard (finance sums, due-soon counts) and the orders/customers list
// pages (client-side queue/segment tabs with count badges). They fetch with this
// ceiling instead of paginating. It sits far above any realistic count of active
// inquiries, upcoming orders, or customers for a boutique operation.
export const ADMIN_MAX_FETCH_LIMIT = 500;

export type PaginationInfo = {
  from: number;
  page: number;
  pageCount: number;
  pageSize: number;
  to: number;
  totalCount: number;
};

export function parsePageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export function getPageRange(page: number, pageSize = ADMIN_PAGE_SIZE) {
  const from = (page - 1) * pageSize;

  return { from, to: from + pageSize - 1 };
}

export function buildPaginationInfo(
  page: number,
  totalCount: number,
  pageSize = ADMIN_PAGE_SIZE,
): PaginationInfo {
  const pageCount = Math.max(Math.ceil(totalCount / pageSize), 1);
  const { from, to } = getPageRange(page, pageSize);

  return { from, page, pageCount, pageSize, to, totalCount };
}

export function escapeIlikeTerm(term: string) {
  // Strip PostgREST or() syntax characters and LIKE wildcards from user input
  // so the term can be embedded safely in an .or(...ilike...) filter string.
  return term.replace(/[,()%_\\]/g, " ").trim();
}
