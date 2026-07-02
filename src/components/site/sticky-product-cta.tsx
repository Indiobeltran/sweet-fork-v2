"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { AnalyticsEventName, AnalyticsParams } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type StickyProductCtaProps = {
  href: string;
  label: string;
  subtext: string;
  targetId?: string;
  analyticsEvent?: AnalyticsEventName;
  analyticsParams?: AnalyticsParams;
};

export function StickyProductCta({
  href,
  label,
  subtext,
  targetId = "product-final-cta",
  analyticsEvent,
  analyticsParams,
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
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 transition duration-200 md:hidden",
        shouldShow ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-full border border-charcoal/10 bg-ivory/94 p-1.5 shadow-[0_18px_48px_rgba(40,31,24,0.18)] backdrop-blur-xl">
        <Link
          href={href}
          onClick={() => {
            if (analyticsEvent) {
              trackAnalyticsEvent(analyticsEvent, analyticsParams);
            }
          }}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-charcoal px-5 py-3 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-soft transition duration-200 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
        >
          {label}
        </Link>
        <p className="sr-only">{subtext}</p>
      </div>
    </div>
  );
}
