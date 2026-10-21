"use client";

import { useEffect, useRef } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { AnalyticsEventName, AnalyticsParams } from "@/lib/analytics/events";
import { observeAnalyticsVisibility } from "@/components/analytics/visibility-analytics-observer";

type VisibilityAnalyticsProps = {
  eventName: AnalyticsEventName;
  params?: AnalyticsParams;
  targetId: string;
  threshold?: number;
};

export function VisibilityAnalytics({
  eventName,
  params,
  targetId,
  threshold = 0,
}: VisibilityAnalyticsProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    const element = document.getElementById(targetId);

    if (!element || trackedRef.current) {
      return;
    }

    return observeAnalyticsVisibility(
      element,
      () => {
        if (trackedRef.current) {
          return true;
        }

        const accepted = trackAnalyticsEvent(eventName, params);
        trackedRef.current = accepted;
        return accepted;
      },
      threshold,
    );
  }, [eventName, params, targetId, threshold]);

  return null;
}
