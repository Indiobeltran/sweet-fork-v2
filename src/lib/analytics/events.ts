import type { BudgetRangeValue, ProductType } from "@/types/domain";

export const INQUIRY_FORM_VERSION = "inquiry_wizard_v3" as const;

export const inquiryAnalyticsSteps = [
  { id: "event_details", name: "Event Details" },
  { id: "select_desserts", name: "Select Desserts" },
  { id: "customize_items", name: "Customize Items" },
  { id: "style_inspiration", name: "Style & Inspiration" },
  { id: "review_submit", name: "Review & Submit" },
] as const;

export type InquiryStepId = (typeof inquiryAnalyticsSteps)[number]["id"];
export type InquiryStepName = (typeof inquiryAnalyticsSteps)[number]["name"];

export const inquiryValidationErrorCodes = [
  "feature_disabled",
  "invalid_date",
  "invalid_format",
  "invalid_value",
  "out_of_range",
  "past_date",
  "required",
] as const;

export type InquiryValidationErrorCode =
  (typeof inquiryValidationErrorCodes)[number];

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
  "inquiry_back_clicked",
  "inquiry_validation_error",
  "inquiry_submission_error",
  "generate_lead",
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
  | "error_code"
  | "field_id"
  | "form_version"
  | "from_step_id"
  | "gallery_category"
  | "gallery_position"
  | "has_inspiration_links"
  | "lead_time_bucket"
  | "page_path"
  | "product_category"
  | "product_slug"
  | "selected_product_count"
  | "step_id"
  | "step_name"
  | "step_number"
  | "to_step_id";

export type AnalyticsParamValue = boolean | number | string;
export type AnalyticsParams = Partial<Record<AnalyticsParamKey, AnalyticsParamValue>>;
export type AnalyticsEventEmitter = (
  eventName: AnalyticsEventName,
  params?: AnalyticsParams,
) => void;

export type InquiryAnalyticsSession = {
  completedStepIds: Set<InquiryStepId>;
  generateLeadSent: boolean;
  started: boolean;
  viewedStepIds: Set<InquiryStepId>;
};

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
  "error_code",
  "field_id",
  "form_version",
  "from_step_id",
  "gallery_category",
  "gallery_position",
  "has_inspiration_links",
  "lead_time_bucket",
  "page_path",
  "product_category",
  "product_slug",
  "selected_product_count",
  "step_id",
  "step_name",
  "step_number",
  "to_step_id",
]);

const inquiryStepIdSet = new Set<string>(
  inquiryAnalyticsSteps.map((step) => step.id),
);
const inquiryStepNameSet = new Set<string>(
  inquiryAnalyticsSteps.map((step) => step.name),
);
const inquiryValidationErrorCodeSet = new Set<string>(
  inquiryValidationErrorCodes,
);
const inquiryFieldIdSet = new Set([
  "additional_notes",
  "budget_flexibility",
  "budget_range",
  "color_palette",
  "customer_email",
  "customer_name",
  "customer_phone",
  "delivery_zip",
  "event_date",
  "event_type",
  "fulfillment_method",
  "guest_count",
  "how_did_you_hear",
  "inspiration_links",
  "inspiration_text",
  "instagram_handle",
  "order_items",
  "order_items_color_palette",
  "order_items_cookie_count",
  "order_items_cupcake_count",
  "order_items_design_notes",
  "order_items_flavor_notes",
  "order_items_icing_style",
  "order_items_inspiration_notes",
  "order_items_kit_count",
  "order_items_macaron_count",
  "order_items_quantity",
  "order_items_servings",
  "order_items_shape",
  "order_items_size_label",
  "order_items_tiers",
  "order_items_topper_text",
  "order_items_wedding_servings",
  "preferred_contact",
]);
const canonicalProductionHosts = new Set(["thesweetfork.com"]);

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return analyticsEventNameSet.has(value);
}

export function getInquiryAnalyticsStep(stepIndex: number) {
  return inquiryAnalyticsSteps[stepIndex] ?? inquiryAnalyticsSteps[0];
}

export function createInquiryAnalyticsSession(): InquiryAnalyticsSession {
  return {
    completedStepIds: new Set<InquiryStepId>(),
    generateLeadSent: false,
    started: false,
    viewedStepIds: new Set<InquiryStepId>(),
  };
}

export function consumeInquiryStarted(session: InquiryAnalyticsSession) {
  if (session.started) {
    return false;
  }

  session.started = true;
  return true;
}

export function consumeInquiryStepViewed(
  session: InquiryAnalyticsSession,
  stepId: InquiryStepId,
) {
  if (session.viewedStepIds.has(stepId)) {
    return false;
  }

  session.viewedStepIds.add(stepId);
  return true;
}

export function consumeInquiryStepCompleted(
  session: InquiryAnalyticsSession,
  stepId: InquiryStepId,
) {
  if (session.completedStepIds.has(stepId)) {
    return false;
  }

  session.completedStepIds.add(stepId);
  return true;
}

function isPersistedInquiryConfirmation(value: unknown) {
  return Boolean(
    value &&
      typeof value === "object" &&
      "inquiryId" in value &&
      typeof value.inquiryId === "string" &&
      value.inquiryId.length > 0 &&
      "persisted" in value &&
      value.persisted === true &&
      "referenceCode" in value &&
      typeof value.referenceCode === "string" &&
      value.referenceCode.length > 0,
  );
}

export function emitGenerateLeadAfterPersistence({
  confirmation,
  emit,
  params,
  session,
}: {
  confirmation: unknown;
  emit: AnalyticsEventEmitter;
  params: AnalyticsParams;
  session: InquiryAnalyticsSession;
}) {
  if (
    session.generateLeadSent ||
    !isPersistedInquiryConfirmation(confirmation)
  ) {
    return false;
  }

  session.generateLeadSent = true;
  emit("generate_lead", {
    ...params,
    form_version: INQUIRY_FORM_VERSION,
  });
  return true;
}

function camelToSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export function getInquiryFieldId(path: string) {
  const normalizedPath = path.replace(/^orderItems\.\d+\./, "orderItems.");
  const fieldId = camelToSnakeCase(normalizedPath.replace(/\./g, "_"));

  return inquiryFieldIdSet.has(fieldId) ? fieldId : "order_items";
}

export function getInquiryValidationErrorCode(
  fieldId: string,
  message: string,
): InquiryValidationErrorCode {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("turned off")) {
    return "feature_disabled";
  }

  if (normalizedMessage.includes("cannot be in the past")) {
    return "past_date";
  }

  if (fieldId === "event_date" && normalizedMessage.includes("valid")) {
    return "invalid_date";
  }

  if (
    normalizedMessage.includes("valid") ||
    normalizedMessage.includes("http or https") ||
    normalizedMessage.includes("standard phone")
  ) {
    return "invalid_format";
  }

  if (
    normalizedMessage.includes("too big") ||
    normalizedMessage.includes("too small") ||
    normalizedMessage.includes("at most") ||
    normalizedMessage.includes("at least") ||
    normalizedMessage.includes("under ")
  ) {
    return "out_of_range";
  }

  if (
    normalizedMessage.includes("required") ||
    normalizedMessage.startsWith("choose ") ||
    normalizedMessage.startsWith("select ") ||
    normalizedMessage.startsWith("tell us ") ||
    normalizedMessage.startsWith("enter your ") ||
    normalizedMessage.includes("need a")
  ) {
    return "required";
  }

  return "invalid_value";
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
        (key === "step_id" ||
          key === "from_step_id" ||
          key === "to_step_id") &&
        (typeof value !== "string" || !inquiryStepIdSet.has(value))
      ) {
        return accumulator;
      }

      if (
        key === "step_name" &&
        (typeof value !== "string" || !inquiryStepNameSet.has(value))
      ) {
        return accumulator;
      }

      if (
        key === "form_version" &&
        value !== INQUIRY_FORM_VERSION
      ) {
        return accumulator;
      }

      if (
        key === "field_id" &&
        (typeof value !== "string" || !inquiryFieldIdSet.has(value))
      ) {
        return accumulator;
      }

      if (
        key === "error_code" &&
        (typeof value !== "string" ||
          !inquiryValidationErrorCodeSet.has(value))
      ) {
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
