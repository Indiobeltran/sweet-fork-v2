import type { BudgetRangeValue, ProductType } from "@/types/domain";

export const analyticsEventNames = [
  "product_viewed",
  "product_cta_clicked",
  "pricing_section_viewed",
  "faq_opened",
  "gallery_filter_used",
  "gallery_item_viewed",
  "gallery_item_navigated",
  "inquiry_started",
  "inquiry_step_viewed",
  "inquiry_step_completed",
  "inquiry_step_back",
  "inquiry_validation_error",
  "inspiration_image_added",
  "inquiry_submission_error",
  "inquiry_submitted",
  "wedding_consultation_started",
  "contact_method_clicked",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type AnalyticsParamKey =
  | "budget_bucket"
  | "contact_method"
  | "cta_location"
  | "delivery_method"
  | "error_category"
  | "gallery_category"
  | "gallery_position"
  | "has_inspiration_images"
  | "lead_time_bucket"
  | "occasion_type"
  | "page_path"
  | "product_category"
  | "product_slug"
  | "selected_product_count"
  | "step_name"
  | "step_number";

export type AnalyticsParamValue = boolean | number | string;
export type AnalyticsParams = Partial<Record<AnalyticsParamKey, AnalyticsParamValue>>;

export type AnalyticsRuntimeInput = {
  hostname: string;
  measurementId: string | undefined;
  nodeEnv: string | undefined;
  pathname: string;
};

export type AnalyticsRuntimeState =
  | { enabled: true; reason: "enabled" }
  | {
      enabled: false;
      reason:
        | "admin_path"
        | "local_host"
        | "missing_measurement_id"
        | "non_production"
        | "preview_or_temporary_host";
    };

declare global {
  interface Window {
    __sweetForkAnalytics?: {
      lastPageViewKey?: string;
    };
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>,
    ) => void;
  }
}

const analyticsEventNameSet = new Set<string>(analyticsEventNames);
const allowedParamKeys = new Set<AnalyticsParamKey>([
  "budget_bucket",
  "contact_method",
  "cta_location",
  "delivery_method",
  "error_category",
  "gallery_category",
  "gallery_position",
  "has_inspiration_images",
  "lead_time_bucket",
  "occasion_type",
  "page_path",
  "product_category",
  "product_slug",
  "selected_product_count",
  "step_name",
  "step_number",
]);

const canonicalProductionHosts = new Set(["thesweetfork.com"]);

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return analyticsEventNameSet.has(value);
}

export function getAnalyticsRuntimeState({
  hostname,
  measurementId,
  nodeEnv,
  pathname,
}: AnalyticsRuntimeInput): AnalyticsRuntimeState {
  if (!measurementId?.trim()) {
    return { enabled: false, reason: "missing_measurement_id" };
  }

  if (nodeEnv !== "production") {
    return { enabled: false, reason: "non_production" };
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return { enabled: false, reason: "admin_path" };
  }

  const normalizedHost = hostname.toLowerCase();

  if (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.endsWith(".local")
  ) {
    return { enabled: false, reason: "local_host" };
  }

  if (!canonicalProductionHosts.has(normalizedHost)) {
    return { enabled: false, reason: "preview_or_temporary_host" };
  }

  return { enabled: true, reason: "enabled" };
}

function getPageViewStore() {
  window.__sweetForkAnalytics = window.__sweetForkAnalytics ?? {};

  return window.__sweetForkAnalytics;
}

export function normalizeAnalyticsPagePath(path: string) {
  const rawPath = path.trim() || "/";

  try {
    return new URL(rawPath, "https://thesweetfork.com").pathname || "/";
  } catch {
    return rawPath.split(/[?#]/)[0] || "/";
  }
}

export function getGoogleAnalyticsInitScript(measurementId: string) {
  return `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `;
}

export function trackAnalyticsPageView(measurementId: string, path: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  const normalizedPath = normalizeAnalyticsPagePath(path);
  const pageViewStore = getPageViewStore();

  if (pageViewStore.lastPageViewKey === normalizedPath) {
    return false;
  }

  try {
    window.gtag("event", "page_view", {
      page_location: `${window.location.origin}${normalizedPath}`,
      page_path: normalizedPath,
      page_title: document.title,
      send_to: measurementId,
    });
    pageViewStore.lastPageViewKey = normalizedPath;
    return true;
  } catch {
    // Page-view tracking is non-critical and must fail closed.
    return false;
  }
}

export function trackAnalyticsPageViewForRuntime(input: AnalyticsRuntimeInput) {
  const normalizedPath = normalizeAnalyticsPagePath(input.pathname);
  const runtimeState = getAnalyticsRuntimeState({
    ...input,
    pathname: normalizedPath,
  });

  if (!runtimeState.enabled || !input.measurementId?.trim()) {
    return false;
  }

  return trackAnalyticsPageView(input.measurementId, normalizedPath);
}

export function buildAnalyticsEventPayload(
  eventName: AnalyticsEventName,
  params: Record<string, unknown> = {},
) {
  if (!isAnalyticsEventName(eventName)) {
    return null;
  }

  const safeParams = Object.entries(params).reduce<AnalyticsParams>(
    (accumulator, [key, value]) => {
      if (!allowedParamKeys.has(key as AnalyticsParamKey)) {
        return accumulator;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        accumulator[key as AnalyticsParamKey] = value;
      }

      return accumulator;
    },
    {},
  );

  return {
    eventName,
    params: safeParams,
  };
}

export function getProductCategory(productType: ProductType | string) {
  switch (productType) {
    case "custom-cake":
    case "custom-cakes":
      return "custom_cakes";
    case "wedding-cake":
    case "wedding-cakes":
      return "wedding_cakes";
    case "sugar-cookies":
      return "sugar_cookies";
    case "diy-kit":
    case "diy-kits":
      return "diy_kits";
    case "cupcakes":
    case "macarons":
      return productType;
    default:
      return "other";
  }
}

export function getBudgetBucket(value: BudgetRangeValue | string | undefined) {
  switch (value) {
    case "under-150":
      return "under_150";
    case "150-300":
      return "150_300";
    case "300-600":
      return "300_600";
    case "600-1000":
      return "600_1000";
    case "1000-2000":
      return "1000_2000";
    case "2000-plus":
      return "2000_plus";
    case "under-75":
      return "under_75";
    case "75-150":
      return "75_150";
    case "300-500":
      return "300_500";
    case "500-plus":
      return "500_plus";
    case "not-sure":
      return "not_sure";
    default:
      return "unknown";
  }
}

export function getLeadTimeBucket(eventDate: string | undefined, referenceDate = new Date()) {
  if (!eventDate) {
    return "unknown";
  }

  const parsedDate = new Date(`${eventDate}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "unknown";
  }

  const days = Math.ceil(
    (parsedDate.getTime() - referenceDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (days < 0) {
    return "past";
  }

  if (days < 14) {
    return "under_2_weeks";
  }

  if (days <= 28) {
    return "2_4_weeks";
  }

  return "over_4_weeks";
}
