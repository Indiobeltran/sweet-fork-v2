"use client";

import { useEffect, useRef } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { getProductCategory } from "@/lib/analytics/events";

type ProductAnalyticsProps = {
  slug: string;
};

export function ProductAnalytics({ slug }: ProductAnalyticsProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;
    trackAnalyticsEvent("product_viewed", {
      page_path: `/${slug}`,
      product_category: getProductCategory(slug),
      product_slug: slug,
    });
  }, [slug]);

  return null;
}
