"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { flushAnalyticsEvents } from "@/lib/analytics/client";
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
  const initialPathRef = useRef(pathname);
  const initialPageViewSentRef = useRef(false);
  const [host, setHost] = useState("");
  const [isReady, setIsReady] = useState(false);
  const normalizedMeasurementId = measurementId?.trim();

  useEffect(() => {
    setHost(window.location.hostname);
    // The public layout unmounts when entering admin; recheck the current URL
    // then so a delayed tag cannot retain public events across that boundary.
    return () => {
      flushAnalyticsEvents();
    };
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

  useEffect(() => {
    if (
      !runtimeState.enabled ||
      !normalizedMeasurementId ||
      !isReady
    ) {
      return;
    }

    const currentRuntime = {
      hostname: window.location.hostname,
      measurementId: normalizedMeasurementId,
      nodeEnv: process.env.NODE_ENV,
      pathname: window.location.pathname,
    };
    if (!getAnalyticsRuntimeState(currentRuntime).enabled) {
      flushAnalyticsEvents();
      return;
    }

    if (!initialPageViewSentRef.current) {
      initialPageViewSentRef.current = trackAnalyticsPageViewForRuntime({
        ...currentRuntime,
        pathname: initialPathRef.current,
      });
    }
    flushAnalyticsEvents();
  }, [isReady, normalizedMeasurementId, pathname, runtimeState.enabled]);

  useEffect(() => {
    if (host && !runtimeState.enabled) {
      flushAnalyticsEvents();
    }
  }, [host, pathname, runtimeState.enabled]);

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
