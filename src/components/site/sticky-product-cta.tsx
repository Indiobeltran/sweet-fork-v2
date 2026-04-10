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
  const [hasScrolledIntoPage, setHasScrolledIntoPage] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);

    if (!target) {
      setIsVisible(true);
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

  useEffect(() => {
    const updateScrollState = () => {
      const revealThreshold = Math.min(window.innerHeight * 0.55, 320);
      setHasScrolledIntoPage(window.scrollY >= revealThreshold);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const shouldShow = hasScrolledIntoPage && isVisible;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 transition duration-200 md:hidden",
        shouldShow ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
    >
      <div className="pointer-events-auto rounded-[1.75rem] border border-charcoal/10 bg-ivory/92 p-3 shadow-[0_20px_60px_rgba(40,31,24,0.18)] backdrop-blur-xl">
        <Link
          href={href}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-charcoal px-5 py-4 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-soft transition duration-200 active:scale-[0.985]"
        >
          {label}
        </Link>
        <p className="mt-2 text-center text-xs text-charcoal/66">{subtext}</p>
      </div>
    </div>
  );
}
