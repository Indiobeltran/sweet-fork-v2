"use client";

import Link from "next/link";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { AnalyticsEventName, AnalyticsParams } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type SitePrimaryCtaProps = {
  href: string;
  label: string;
  subtext?: string;
  className?: string;
  buttonClassName?: string;
  align?: "left" | "center";
  analyticsEvent?: AnalyticsEventName;
  analyticsParams?: AnalyticsParams;
};

export function SitePrimaryCta({
  href,
  label,
  subtext,
  className,
  buttonClassName,
  align = "left",
  analyticsEvent,
  analyticsParams,
}: SitePrimaryCtaProps) {
  return (
    <div className={cn("w-full", align === "center" && "text-center", className)}>
      <Link
        href={href}
        onClick={() => {
          if (analyticsEvent) {
            trackAnalyticsEvent(analyticsEvent, analyticsParams);
          }
        }}
        className={cn(
          "inline-flex min-h-14 w-full items-center justify-center rounded-full bg-charcoal px-6 py-4 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-[0_18px_38px_rgba(44,36,27,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-charcoal/92 active:scale-[0.985] sm:w-auto",
          buttonClassName,
        )}
      >
        {label}
      </Link>
      {subtext ? (
        <p
          className={cn(
            "mt-3 text-sm text-charcoal/66",
            align === "center" && "text-center",
          )}
        >
          {subtext}
        </p>
      ) : null}
    </div>
  );
}
