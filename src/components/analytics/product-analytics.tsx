"use client";

import { useEffect, useRef } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { getProductCategory } from "@/lib/analytics/events";

type ProductAnalyticsProps = {
  slug: string;
};

export function ProductAnalytics({ slug }: ProductAnalyticsProps) {
  const trackedSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (trackedSlugRef.current === slug) {
      return;
    }

    const accepted = trackAnalyticsEvent("product_viewed", {
      page_path: `/${slug}`,
      product_category: getProductCategory(slug),
      product_slug: slug,
    });
    if (accepted) {
      trackedSlugRef.current = slug;
    }
  }, [slug]);

  return null;
}
