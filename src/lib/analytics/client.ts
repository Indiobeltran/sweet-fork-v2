"use client";

import {
  type AnalyticsEventName,
  type AnalyticsParams,
  buildAnalyticsEventPayload,
} from "./events";

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
