import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationInfo } from "@/lib/admin/pagination";
import { cn } from "@/lib/utils";

type PaginationLinksProps = {
  basePath: string;
  filterQuery?: string;
  pagination: PaginationInfo;
};

const linkClasses =
  "inline-flex min-h-10 items-center gap-1 rounded-full border border-charcoal/10 bg-white/82 px-4 text-sm font-medium text-charcoal transition hover:border-charcoal/20 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50";
const disabledClasses =
  "inline-flex min-h-10 items-center gap-1 rounded-full border border-charcoal/8 bg-white/50 px-4 text-sm font-medium text-charcoal/35";

function buildPageHref(basePath: string, filterQuery: string, page: number) {
  const params = new URLSearchParams(filterQuery);

  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function PaginationLinks({
  basePath,
  filterQuery = "",
  pagination,
}: Readonly<PaginationLinksProps>) {
  if (pagination.pageCount <= 1) {
    return null;
  }

  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.page < pagination.pageCount;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-charcoal/8 bg-white/70 px-4 py-3"
    >
      {hasPrevious ? (
        <Link
          className={linkClasses}
          href={buildPageHref(basePath, filterQuery, pagination.page - 1)}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClasses}>
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Previous
        </span>
      )}

      <p className={cn("text-sm text-charcoal/64")}>
        Page <span className="font-semibold text-charcoal">{pagination.page}</span> of{" "}
        {pagination.pageCount}
        <span className="hidden sm:inline"> · {pagination.totalCount} total</span>
      </p>

      {hasNext ? (
        <Link
          className={linkClasses}
          href={buildPageHref(basePath, filterQuery, pagination.page + 1)}
        >
          Next
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClasses}>
          Next
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
