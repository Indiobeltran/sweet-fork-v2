import Link from "next/link";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ActiveFilterPill = {
  clearHref?: string;
  label: string;
  value?: string;
};

type ActiveFilterPillsProps = {
  className?: string;
  clearAllHref?: string;
  emptyLabel?: string;
  items: ActiveFilterPill[];
};

function getPillText(item: ActiveFilterPill) {
  return item.value ? `${item.label}: ${item.value}` : item.label;
}

export function ActiveFilterPills({
  className,
  clearAllHref,
  emptyLabel,
  items,
}: Readonly<ActiveFilterPillsProps>) {
  if (items.length === 0 && !emptyLabel) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.length === 0 ? (
        <span className="rounded-full border border-charcoal/8 bg-white/74 px-3 py-2 text-sm text-charcoal/58">
          {emptyLabel}
        </span>
      ) : null}

      {items.map((item) =>
        item.clearHref ? (
          <Link
            key={`${item.label}-${item.value ?? ""}`}
            href={item.clearHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-charcoal/10 bg-white/86 px-4 text-sm font-medium text-charcoal transition hover:border-charcoal/20 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
          >
            <span>{getPillText(item)}</span>
            <X aria-hidden="true" className="h-3.5 w-3.5 text-charcoal/48" />
          </Link>
        ) : (
          <span
            key={`${item.label}-${item.value ?? ""}`}
            className="inline-flex min-h-10 items-center rounded-full border border-charcoal/10 bg-white/86 px-4 text-sm font-medium text-charcoal"
          >
            {getPillText(item)}
          </span>
        ),
      )}

      {clearAllHref ? (
        <Link
          href={clearAllHref}
          className="inline-flex min-h-10 items-center rounded-full border border-charcoal/12 bg-ivory/82 px-4 text-sm font-medium text-charcoal/74 transition hover:border-charcoal/24 hover:bg-white hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
        >
          Clear all
        </Link>
      ) : null}
    </div>
  );
}
