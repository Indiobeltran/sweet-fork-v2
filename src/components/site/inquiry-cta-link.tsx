"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import {
  emitInquiryCtaClick,
  type AnalyticsEventName,
  type AnalyticsParams,
  type InquiryCtaLocation,
} from "@/lib/analytics/events";

type InquiryCtaLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  ctaLocation: InquiryCtaLocation;
  productCategory?: string;
  legacyEvent?: AnalyticsEventName;
  legacyParams?: AnalyticsParams;
};

export function InquiryCtaLink({
  href,
  ctaLocation,
  productCategory,
  legacyEvent,
  legacyParams,
  onClick,
  ...props
}: InquiryCtaLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        const pathname = window.location.pathname;
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        emitInquiryCtaClick({
          href,
          pathname,
          ctaLocation,
          productCategory,
          legacyEvent,
          legacyParams,
          emit: trackAnalyticsEvent,
        });
      }}
    />
  );
}
