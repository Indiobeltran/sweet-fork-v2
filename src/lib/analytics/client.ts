"use client";

import {
  type AnalyticsEventName,
  type AnalyticsParams,
  buildAnalyticsEventPayload,
} from "@/lib/analytics/events";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>,
    ) => void;
  }
}

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsParams = {},
) {
  const payload = buildAnalyticsEventPayload(eventName, params);

  if (!payload || typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  try {
    window.gtag("event", payload.eventName, payload.params);
  } catch {
    // Analytics must never interrupt customer navigation or inquiry submission.
  }
}

export function trackAnalyticsPageView(measurementId: string, path: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  try {
    window.gtag("config", measurementId, {
      page_location: `${window.location.origin}${path}`,
      page_path: path,
      page_title: document.title,
      send_page_view: false,
    });
    return true;
  } catch {
    // Page-view tracking is non-critical and must fail closed.
    return false;
  }
}
