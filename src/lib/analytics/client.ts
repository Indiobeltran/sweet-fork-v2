"use client";

import {
  type AnalyticsEventName,
  type AnalyticsParams,
  flushAnalyticsEventsForRuntime,
  trackAnalyticsEventForRuntime,
} from "./events";

function getBrowserRuntime() {
  if (typeof window === "undefined") {
    return null;
  }
  return {
    hostname: window.location.hostname,
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    nodeEnv: process.env.NODE_ENV,
    pathname: window.location.pathname,
  };
}

export function flushAnalyticsEvents() {
  const runtime = getBrowserRuntime();
  return runtime ? flushAnalyticsEventsForRuntime(runtime) : 0;
}

// True means accepted for dispatch or bounded queueing, not confirmed by GA4.
export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsParams = {},
) {
  const runtime = getBrowserRuntime();
  return runtime ? trackAnalyticsEventForRuntime(runtime, eventName, params) : false;
}
