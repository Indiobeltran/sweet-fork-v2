"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type StickyProductCtaProps = {
  href: string;
  label: string;
  subtext: string;
  targetId?: string;
};

export function StickyProductCta({
  href,
  label,
  subtext,
  targetId = "product-final-cta",
}: StickyProductCtaProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      {
        threshold: 0.2,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 transition duration-200 md:hidden",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
    >
      <div className="pointer-events-auto rounded-[1.75rem] border border-charcoal/10 bg-ivory/92 p-3 shadow-[0_20px_60px_rgba(40,31,24,0.18)] backdrop-blur-xl">
        <Link
          href={href}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-charcoal px-5 py-4 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-soft transition duration-200 active:scale-[0.985]"
        >
          {label}
        </Link>
        <p className="mt-2 text-center text-xs text-charcoal/56">{subtext}</p>
      </div>
    </div>
  );
}
