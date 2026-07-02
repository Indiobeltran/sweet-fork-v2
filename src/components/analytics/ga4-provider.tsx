"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { getAnalyticsRuntimeState } from "@/lib/analytics/events";
import { trackAnalyticsPageView } from "@/lib/analytics/client";

type GoogleAnalyticsProviderProps = {
  measurementId?: string;
};

function GoogleAnalyticsRuntime({ measurementId }: GoogleAnalyticsProviderProps) {
  const pathname = usePathname();
  const [host, setHost] = useState("");
  const [isReady, setIsReady] = useState(false);
  const trackedPathRef = useRef<string | null>(null);
  const normalizedMeasurementId = measurementId?.trim();

  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  const path = pathname;

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
    if (!runtimeState.enabled || !normalizedMeasurementId || !isReady) {
      return;
    }

    if (trackedPathRef.current === path) {
      return;
    }

    if (trackAnalyticsPageView(normalizedMeasurementId, path)) {
      trackedPathRef.current = path;
    }
  }, [isReady, normalizedMeasurementId, path, runtimeState.enabled]);

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
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${normalizedMeasurementId}', { send_page_view: false });
        `}
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
