"use client";

import { useEffect, useRef } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { AnalyticsEventName, AnalyticsParams } from "@/lib/analytics/events";

type VisibilityAnalyticsProps = {
  eventName: AnalyticsEventName;
  params?: AnalyticsParams;
  threshold?: number;
};

export function VisibilityAnalytics({
  eventName,
  params,
  threshold = 0.55,
}: VisibilityAnalyticsProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || trackedRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || trackedRef.current) {
          return;
        }

        trackedRef.current = true;
        trackAnalyticsEvent(eventName, params);
        observer.disconnect();
      },
      { threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [eventName, params, threshold]);

  return <div ref={elementRef} aria-hidden="true" className="sr-only" />;
}
