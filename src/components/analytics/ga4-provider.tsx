"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

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
      !isReady ||
      initialPageViewSentRef.current
    ) {
      return;
    }

    initialPageViewSentRef.current = trackAnalyticsPageViewForRuntime({
      hostname: window.location.hostname,
      measurementId: normalizedMeasurementId,
      nodeEnv: process.env.NODE_ENV,
      pathname: initialPathRef.current,
    });
  }, [isReady, normalizedMeasurementId, runtimeState.enabled]);

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
