"use client";

import { InquiryCtaLink } from "@/components/site/inquiry-cta-link";
import { isInquiryCtaLocation, type AnalyticsEventName, type AnalyticsParams, type InquiryCtaLocation } from "@/lib/analytics/events";
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
  inquiryLocation?: InquiryCtaLocation;
  inquiryProductCategory?: string;
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
  inquiryLocation,
  inquiryProductCategory,
}: SitePrimaryCtaProps) {
  const ctaLocation = inquiryLocation ?? (
    isInquiryCtaLocation(analyticsParams?.cta_location) ? analyticsParams.cta_location : "page_hero"
  );
  const productCategory = inquiryProductCategory ?? (
    typeof analyticsParams?.product_category === "string" ? analyticsParams.product_category : undefined
  );
  return (
    <div className={cn("w-full", align === "center" && "text-center", className)}>
      <InquiryCtaLink
        href={href}
        ctaLocation={ctaLocation}
        productCategory={productCategory}
        legacyEvent={analyticsEvent}
        legacyParams={analyticsParams}
        className={cn(
          "inline-flex min-h-14 w-full items-center justify-center rounded-full bg-charcoal px-6 py-4 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-[0_18px_38px_rgba(44,36,27,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-charcoal/92 active:scale-[0.985] sm:w-auto",
          buttonClassName,
        )}
      >
        {label}
      </InquiryCtaLink>
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
