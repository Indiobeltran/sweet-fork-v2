"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import {
  getAnalyticsRuntimeState,
  getGoogleAnalyticsInitScript,
  trackAnalyticsPageViewForRuntime,
} from "@/lib/analytics/events";

type GoogleAnalyticsProviderProps = {
  measurementId?: string;
};

function GoogleAnalyticsRuntime({ measurementId }: GoogleAnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [host, setHost] = useState("");
  const [isReady, setIsReady] = useState(false);
  const normalizedMeasurementId = measurementId?.trim();
  const searchKey = searchParams.toString();

  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  const runtimeState =
    host.length > 0
      ? getAnalyticsRuntimeState({
          hostname: host,
          measurementId: normalizedMeasurementId,
          nodeEnv: process.env.NODE_ENV,
          pathname,
        })
      : { enabled: false as const, reason: "preview_or_temporary_host" as const };

  const trackCurrentPageView = useCallback(
    (path: string) => {
      if (!normalizedMeasurementId) {
        return false;
      }

      return trackAnalyticsPageViewForRuntime({
        hostname: window.location.hostname,
        measurementId: normalizedMeasurementId,
        nodeEnv: process.env.NODE_ENV,
        pathname: path,
      });
    },
    [normalizedMeasurementId],
  );

  useEffect(() => {
    if (!runtimeState.enabled || !normalizedMeasurementId || !isReady) {
      return;
    }

    trackCurrentPageView(`${pathname}${searchKey ? `?${searchKey}` : ""}`);
  }, [
    isReady,
    normalizedMeasurementId,
    pathname,
    runtimeState.enabled,
    searchKey,
    trackCurrentPageView,
  ]);

  useEffect(() => {
    if (!runtimeState.enabled || !normalizedMeasurementId || !isReady) {
      return;
    }

    const trackLocation = () => {
      queueMicrotask(() => {
        trackCurrentPageView(`${window.location.pathname}${window.location.search}`);
      });
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const wrappedPushState: History["pushState"] = function pushState(
      this: History,
      ...args
    ) {
      const result = originalPushState.apply(this, args);
      trackLocation();

      return result;
    };

    const wrappedReplaceState: History["replaceState"] = function replaceState(
      this: History,
      ...args
    ) {
      const result = originalReplaceState.apply(this, args);
      trackLocation();

      return result;
    };

    window.history.pushState = wrappedPushState;
    window.history.replaceState = wrappedReplaceState;
    window.addEventListener("popstate", trackLocation);

    return () => {
      window.removeEventListener("popstate", trackLocation);

      if (window.history.pushState === wrappedPushState) {
        window.history.pushState = originalPushState;
      }

      if (window.history.replaceState === wrappedReplaceState) {
        window.history.replaceState = originalReplaceState;
      }
    };
  }, [isReady, normalizedMeasurementId, runtimeState.enabled, trackCurrentPageView]);

  if (!runtimeState.enabled || !normalizedMeasurementId) {
    return null;
  }

  return (
    <>
      <Script
        id="ga4-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
          normalizedMeasurementId,
        )}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive" onReady={() => setIsReady(true)}>
        {getGoogleAnalyticsInitScript(normalizedMeasurementId)}
      </Script>
    </>
  );
}

export function GoogleAnalyticsProvider(props: GoogleAnalyticsProviderProps) {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsRuntime {...props} />
    </Suspense>
  );
}
