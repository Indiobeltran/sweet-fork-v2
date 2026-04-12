"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type StatusChipRowItem = {
  count?: number | string;
  href: string;
  isActive?: boolean;
  label: string;
};

type StatusChipRowProps = {
  ariaLabel: string;
  className?: string;
  items: StatusChipRowItem[];
};

export function StatusChipRow({
  ariaLabel,
  className,
  items,
}: Readonly<StatusChipRowProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const activeChip = containerRef.current?.querySelector<HTMLElement>('[data-active="true"]');

    if (!activeChip) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      activeChip.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [items]);

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]",
        className,
      )}
    >
      <div ref={containerRef} className="inline-flex min-w-full gap-2 py-1">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            aria-current={item.isActive ? "page" : undefined}
            data-active={item.isActive ? "true" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50",
              item.isActive
                ? "border-charcoal/16 bg-charcoal text-ivory shadow-soft"
                : "border-charcoal/10 bg-white/84 text-charcoal/68 hover:border-charcoal/20 hover:bg-white hover:text-charcoal",
            )}
          >
            <span>{item.label}</span>
            {item.count !== undefined ? (
              <span
                className={cn(
                  "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  item.isActive ? "bg-ivory/14 text-ivory" : "bg-charcoal/6 text-charcoal/58",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
