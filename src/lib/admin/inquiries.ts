import "server-only";

import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBudgetRangeLabel, budgetRangeOptions } from "@/lib/inquiries/config";
import { getProductDisplayLabel } from "@/lib/pricing";
import { formatCurrency, toTitleCase } from "@/lib/utils";
import type { BudgetRangeValue } from "@/types/domain";
import type { Enums, Json, Tables } from "@/types/supabase.generated";

type InquiryRow = Tables<"inquiries">;
type InquiryItemRow = Tables<"inquiry_items">;
type InquiryAssetRow = Tables<"inquiry_assets">;
type InquiryNoteRow = Tables<"inquiry_notes">;
type MediaAssetRow = Tables<"media_assets">;
type ProfileRow = Tables<"profiles">;

type InquiryListItemRow = Pick<
  InquiryItemRow,
  | "cookie_count"
  | "cupcake_count"
  | "id"
  | "kit_count"
  | "macaron_count"
  | "product_label"
  | "product_type"
  | "quantity"
  | "servings"
  | "sort_order"
  | "wedding_servings"
>;

type InquiryListQueryRow = Pick<
  InquiryRow,
  | "archived_at"
  | "budget_max"
  | "budget_min"
  | "created_at"
  | "customer_email"
  | "customer_name"
  | "customer_phone"
  | "estimated_max"
  | "estimated_min"
  | "event_date"
  | "event_type"
  | "fulfillment_method"
  | "id"
  | "metadata"
  | "reviewed_at"
  | "source_channel"
  | "status"
  | "submitted_at"
  | "updated_at"
> & {
  inquiry_items: InquiryListItemRow[] | null;
};

type InquiryDetailQueryRow = InquiryRow;

type InquiryAssetQueryRow = Pick<
  InquiryAssetRow,
  | "asset_type"
  | "asset_url"
  | "created_at"
  | "external_url"
  | "id"
  | "inquiry_id"
  | "inquiry_item_id"
  | "label"
  | "media_asset_id"
  | "metadata"
  | "sort_order"
  | "text_content"
  | "updated_at"
> & {
  media_assets:
    | Pick<
        MediaAssetRow,
        "asset_kind" | "bucket" | "id" | "mime_type" | "original_filename" | "public_url" | "storage_path"
      >
    | null;
};

type InquiryNoteQueryRow = Pick<
  InquiryNoteRow,
  "author_profile_id" | "created_at" | "id" | "inquiry_id" | "is_pinned" | "note_body" | "note_type" | "updated_at"
> & {
  profiles: Pick<ProfileRow, "email" | "full_name" | "id"> | null;
};

type InquiryItemDetailRow = Pick<
  InquiryItemRow,
  | "color_palette"
  | "cookie_count"
  | "created_at"
  | "cupcake_count"
  | "design_notes"
  | "detail_json"
  | "estimated_max"
  | "estimated_min"
  | "flavor_notes"
  | "icing_style"
  | "id"
  | "inquiry_id"
  | "inspiration_notes"
  | "kit_count"
  | "macaron_count"
  | "product_label"
  | "product_type"
  | "quantity"
  | "servings"
  | "shape"
  | "size_label"
  | "sort_order"
  | "tiers"
  | "topper_text"
  | "updated_at"
  | "wedding_servings"
>;

export type InquiryListFilters = {
  budgetRange: BudgetRangeValue | "all";
  eventDateFrom: string;
  eventDateTo: string;
  fulfillmentMethod: Enums<"fulfillment_method"> | "all";
  priority: NonNullable<InquirySignalPriority> | "all";
  productType: Enums<"product_type"> | "all";
  status: Enums<"inquiry_status"> | "active" | "all";
  urgency: NonNullable<InquirySignalUrgency> | "all";
};

export type InquirySignalClarity = "low" | "medium" | "high" | null;
export type InquirySignalPriority = "standard" | "high" | null;
export type InquirySignalUrgency = "standard" | "soon" | "rush" | null;

export type InquiryPlaceholderSignals = {
  clarity: InquirySignalClarity;
  daysUntilEvent: number | null;
  priority: InquirySignalPriority;
  urgency: InquirySignalUrgency;
};

export type InquiryListEntry = {
  budgetRangeLabel: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  estimatedLabel: string | null;
  eventDate: string;
  eventType: string;
  fulfillmentMethod: Enums<"fulfillment_method">;
  id: string;
  items: InquiryListItemSummary[];
  priorityLabel: string;
  priorityValue: InquirySignalPriority;
  referenceCode: string;
  reviewedAt: string | null;
  sourceChannel: Enums<"inquiry_source">;
  status: Enums<"inquiry_status">;
  submittedAt: string;
  urgencyLabel: string;
  urgencyValue: InquirySignalUrgency;
};

export type InquiryListItemSummary = {
  id: string;
  productLabel: string;
  productType: Enums<"product_type">;
  requestedQuantityLabel: string;
  sortOrder: number;
};

export type InquiryAssetDisplay = {
  accessState: "available" | "limited";
  assetType: Enums<"inquiry_asset_type">;
  createdAt: string;
  id: string;
  inquiryItemId: string | null;
  label: string;
  mimeType: string | null;
  note: string | null;
  originalFilename: string | null;
  signedUrl: string | null;
  textContent: string | null;
  url: string | null;
};

export type InquiryNoteDisplay = {
  authorLabel: string;
  createdAt: string;
  id: string;
  isPinned: boolean;
  noteBody: string;
  noteType: Enums<"internal_note_type">;
};

export type InquiryItemDetail = {
  colorPalette: string | null;
  designNotes: string | null;
  detailSummary: string | null;
  estimatedLabel: string | null;
  flavorNotes: string | null;
  icingStyleLabel: string | null;
  id: string;
  inspirationNotes: string | null;
  productLabel: string;
  productType: Enums<"product_type">;
  requestedQuantityLabel: string;
  shapeLabel: string | null;
  sizeLabel: string | null;
  sortOrder: number;
  topperText: string | null;
};

export type InquiryEstimateInsightLineItem = {
  detailSummary: string | null;
  drivers: string[];
  estimatedLabel: string | null;
  id: string;
  productLabel: string;
  requestedQuantityLabel: string;
};

export type InquiryEstimateInsight = {
  deliveryLabel: string | null;
  lineItems: InquiryEstimateInsightLineItem[];
  summary: string;
  totalLabel: string | null;
};

export type InquiryDetail = {
  additionalNotes: string | null;
  archivedAt: string | null;
  assets: InquiryAssetDisplay[];
  budgetLabel: string | null;
  clarityLabel: string;
  clarityValue: InquirySignalClarity;
  colorPalette: string | null;
  contact: {
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    instagramHandle: string | null;
    preferredContact: Enums<"contact_preference">;
  };
  convertToOrderNote: string;
  dietaryNotes: string | null;
  estimateInsight: InquiryEstimateInsight;
  estimatedLabel: string | null;
  event: {
    deliveryWindow: string | null;
    eventDate: string;
    eventTime: string | null;
    eventType: string;
    fulfillmentMethod: Enums<"fulfillment_method">;
    guestCount: number | null;
    servingTarget: number | null;
    venueAddress: string | null;
    venueName: string | null;
  };
  howDidYouHear: string | null;
  id: string;
  inspirationLinks: InquiryAssetDisplay[];
  inspirationTextBlocks: InquiryAssetDisplay[];
  internalSummary: string | null;
  items: InquiryItemDetail[];
  notes: InquiryNoteDisplay[];
  priorityLabel: string;
  priorityValue: InquirySignalPriority;
  referenceCode: string;
  reviewedAt: string | null;
  sourceChannel: Enums<"inquiry_source">;
  status: Enums<"inquiry_status">;
  submittedAt: string;
  timestamps: Array<{
    label: string;
    value: string | null;
  }>;
  urgencyLabel: string;
  urgencyValue: InquirySignalUrgency;
  uploads: InquiryAssetDisplay[];
};

export type InquiryListData = {
  entries: InquiryListEntry[];
  filters: InquiryListFilters;
  statusCounts: Record<Enums<"inquiry_status">, number>;
  summary: Array<{
    detail: string;
    label: string;
    value: string;
  }>;
  totalCount: number;
};

const DEFAULT_FILTERS: InquiryListFilters = {
  budgetRange: "all",
  eventDateFrom: "",
  eventDateTo: "",
  fulfillmentMethod: "all",
  priority: "all",
  productType: "all",
  status: "active",
  urgency: "all",
};

function isRecord(value: Json | null | undefined): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(record: Record<string, Json>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getNumberValue(record: Record<string, Json>, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getReferenceCodeFallback(inquiryId: string) {
  return `SF-${inquiryId.slice(0, 8).toUpperCase()}`;
}

function getReferenceCode(row: Pick<InquiryRow, "id" | "metadata">) {
  const metadata = isRecord(row.metadata) ? row.metadata : null;

  if (!metadata) {
    return getReferenceCodeFallback(row.id);
  }

  return getStringValue(metadata, "referenceCode") ?? getReferenceCodeFallback(row.id);
}

function getBudgetRangeValue(
  row: Pick<InquiryRow, "budget_max" | "budget_min" | "metadata">,
): BudgetRangeValue | null {
  const metadata = isRecord(row.metadata) ? row.metadata : null;
  const metadataValue = metadata ? getStringValue(metadata, "budgetRange") : null;

  if (
    metadataValue &&
    budgetRangeOptions.some((option) => option.value === metadataValue)
  ) {
    return metadataValue as BudgetRangeValue;
  }

  if (row.budget_min === null && row.budget_max === null) {
    return null;
  }

  const minimum = row.budget_min ?? 0;
  const maximum = row.budget_max;

  if (minimum === 0 && maximum === null) {
    return "not-sure";
  }
  if (minimum === 0 && maximum !== null && maximum <= 150) {
    return "under-150";
  }
  if (minimum >= 150 && maximum !== null && maximum <= 300) {
    return "150-300";
  }
  if (minimum >= 300 && maximum !== null && maximum <= 600) {
    return "300-600";
  }
  if (minimum >= 600 && maximum !== null && maximum <= 1000) {
    return "600-1000";
  }
  if (minimum >= 1000 && maximum !== null && maximum <= 2000) {
    return "1000-2000";
  }
  if (minimum >= 2000) {
    return "2000-plus";
  }
  if (maximum !== null && maximum <= 75) {
    return "under-75";
  }
  if (minimum >= 75 && maximum !== null && maximum <= 150) {
    return "75-150";
  }
  if (minimum >= 300 && maximum !== null && maximum <= 500) {
    return "300-500";
  }
  if (minimum >= 500) {
    return "500-plus";
  }

  return null;
}

function getBudgetRangeLabelForInquiry(
  row: Pick<InquiryRow, "budget_max" | "budget_min" | "metadata">,
) {
  const metadata = isRecord(row.metadata) ? row.metadata : null;
  const metadataLabel = metadata ? getStringValue(metadata, "budgetRangeLabel") : null;

  if (metadataLabel) {
    return metadataLabel;
  }

  const value = getBudgetRangeValue(row);
  if (value) {
    return getBudgetRangeLabel(value);
  }

  if (row.budget_min !== null || row.budget_max !== null) {
    const minimum = row.budget_min !== null ? formatCurrency(row.budget_min) : "Open";
    const maximum = row.budget_max !== null ? formatCurrency(row.budget_max) : "and up";

    return row.budget_min !== null && row.budget_max !== null
      ? `${minimum} to ${maximum}`
      : `${minimum} ${maximum}`;
  }

  return null;
}

function getInquirySignals(
  metadata: Json,
): InquiryPlaceholderSignals {
  const root = isRecord(metadata) ? metadata : null;
  const placeholderSignals = root?.placeholderSignals;
  const record = isRecord(placeholderSignals) ? placeholderSignals : null;

  if (!record) {
    return {
      clarity: null,
      daysUntilEvent: null,
      priority: null,
      urgency: null,
    };
  }

  const clarityValue = getStringValue(record, "clarity");
  const priorityValue = getStringValue(record, "priority");
  const urgencyValue = getStringValue(record, "urgency");

  return {
    clarity:
      clarityValue === "low" || clarityValue === "medium" || clarityValue === "high"
        ? clarityValue
        : null,
    daysUntilEvent: getNumberValue(record, "daysUntilEvent"),
    priority:
      priorityValue === "standard" || priorityValue === "high" ? priorityValue : null,
    urgency:
      urgencyValue === "standard" || urgencyValue === "soon" || urgencyValue === "rush"
        ? urgencyValue
        : null,
  };
}

function formatRequestedQuantity(item: InquiryListItemRow | InquiryItemDetailRow) {
  switch (item.product_type) {
    case "custom-cake":
      return `${item.servings ?? item.quantity} servings`;
    case "wedding-cake":
      return `${item.wedding_servings ?? item.servings ?? item.quantity} servings`;
    case "cupcakes":
      return `${item.cupcake_count ?? item.quantity * 12} cupcakes`;
    case "sugar-cookies":
      return `${item.cookie_count ?? item.quantity * 12} cookies`;
    case "macarons":
      return `${item.macaron_count ?? item.quantity * 12} macarons`;
    case "diy-kit":
      return `${item.kit_count ?? item.quantity} kit${(item.kit_count ?? item.quantity) === 1 ? "" : "s"}`;
    default:
      return `${item.quantity} item${item.quantity === 1 ? "" : "s"}`;
  }
}

function formatEstimateRange(minimum: number | null, maximum: number | null) {
  if (minimum === null && maximum === null) {
    return null;
  }

  if (minimum !== null && maximum !== null) {
    return `${formatCurrency(minimum)} to ${formatCurrency(maximum)}`;
  }

  if (minimum !== null) {
    return `${formatCurrency(minimum)} and up`;
  }

  return `Up to ${formatCurrency(maximum ?? 0)}`;
}

function getEstimateDrivers(item: InquiryItemDetailRow) {
  const drivers = [`Requested scope: ${formatRequestedQuantity(item)}`];

  if (item.tiers && item.tiers > 1) {
    drivers.push(`${item.tiers} tiers requested`);
  }

  if (item.shape === "heart" || item.shape === "tiered") {
    drivers.push("Special shape requested");
  }

  if (item.icing_style === "painted" || item.icing_style === "mixed") {
    drivers.push("Decorative finish increases labor");
  }

  if (item.topper_text) {
    drivers.push("Custom wording or topper included");
  }

  if (item.design_notes || item.inspiration_notes || item.color_palette) {
    drivers.push("Custom design direction provided");
  }

  return drivers;
}

function buildEstimateInsight(
  inquiry: Pick<InquiryDetailQueryRow, "estimated_max" | "estimated_min" | "fulfillment_method">,
  items: InquiryItemDetailRow[],
): InquiryEstimateInsight {
  const itemMinimum = items.reduce((sum, item) => sum + (item.estimated_min ?? 0), 0);
  const itemMaximum = items.reduce((sum, item) => sum + (item.estimated_max ?? 0), 0);
  const deliveryMinimum =
    inquiry.estimated_min !== null ? Math.max(inquiry.estimated_min - itemMinimum, 0) : null;
  const deliveryMaximum =
    inquiry.estimated_max !== null ? Math.max(inquiry.estimated_max - itemMaximum, 0) : null;

  return {
    deliveryLabel:
      inquiry.fulfillment_method === "delivery" &&
      (deliveryMinimum !== null || deliveryMaximum !== null)
        ? formatEstimateRange(deliveryMinimum, deliveryMaximum)
        : null,
    lineItems: items.map((item) => ({
      detailSummary: getDetailSummary(item.detail_json),
      drivers: getEstimateDrivers(item),
      estimatedLabel: formatEstimateRange(item.estimated_min, item.estimated_max),
      id: item.id,
      productLabel: item.product_label || getProductDisplayLabel(item.product_type),
      requestedQuantityLabel: formatRequestedQuantity(item),
    })),
    summary:
      inquiry.fulfillment_method === "delivery"
        ? "This estimate reflects requested quantities, finish details, and the current internal delivery allowance."
        : "This estimate reflects requested quantities and finish details against the current internal pricing baseline.",
    totalLabel: formatEstimateRange(inquiry.estimated_min, inquiry.estimated_max),
  };
}

function getSignalLabel(
  value: InquirySignalClarity | InquirySignalPriority | InquirySignalUrgency,
  fallback: string,
) {
  return value ? toTitleCase(value) : fallback;
}

function normalizeFilterValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseInquiryListFilters(
  rawSearchParams: Record<string, string | string[] | undefined>,
): InquiryListFilters {
  const next: InquiryListFilters = { ...DEFAULT_FILTERS };

  const status = normalizeFilterValue(rawSearchParams.status);
  if (
    status &&
    ["active", "all", "new", "reviewing", "quoted", "approved", "declined", "archived"].includes(status)
  ) {
    next.status = status as InquiryListFilters["status"];
  }

  const productType = normalizeFilterValue(rawSearchParams.productType);
  if (
    productType &&
    ["custom-cake", "wedding-cake", "cupcakes", "sugar-cookies", "macarons", "diy-kit"].includes(
      productType,
    )
  ) {
    next.productType = productType as InquiryListFilters["productType"];
  }

  const fulfillmentMethod = normalizeFilterValue(rawSearchParams.fulfillmentMethod);
  if (fulfillmentMethod === "pickup" || fulfillmentMethod === "delivery") {
    next.fulfillmentMethod = fulfillmentMethod;
  }

  const budgetRange = normalizeFilterValue(rawSearchParams.budgetRange);
  if (
    budgetRange &&
    budgetRangeOptions.some((option) => option.value === budgetRange)
  ) {
    next.budgetRange = budgetRange as BudgetRangeValue;
  }

  const priority = normalizeFilterValue(rawSearchParams.priority);
  if (priority === "standard" || priority === "high") {
    next.priority = priority;
  }

  const urgency = normalizeFilterValue(rawSearchParams.urgency);
  if (urgency === "standard" || urgency === "soon" || urgency === "rush") {
    next.urgency = urgency;
  }

  const eventDateFrom = normalizeFilterValue(rawSearchParams.eventDateFrom);
  if (/^\d{4}-\d{2}-\d{2}$/.test(eventDateFrom)) {
    next.eventDateFrom = eventDateFrom;
  }

  const eventDateTo = normalizeFilterValue(rawSearchParams.eventDateTo);
  if (/^\d{4}-\d{2}-\d{2}$/.test(eventDateTo)) {
    next.eventDateTo = eventDateTo;
  }

  return next;
}

function matchesFilters(row: InquiryListQueryRow, filters: InquiryListFilters) {
  const signals = getInquirySignals(row.metadata);
  const budgetRangeValue = getBudgetRangeValue(row);
  const items = row.inquiry_items ?? [];

  if (filters.status === "active" && row.status === "archived") {
    return false;
  }

  if (
    filters.status !== "active" &&
    filters.status !== "all" &&
    row.status !== filters.status
  ) {
    return false;
  }

  if (filters.productType !== "all" && !items.some((item) => item.product_type === filters.productType)) {
    return false;
  }

  if (
    filters.eventDateFrom &&
    row.event_date.localeCompare(filters.eventDateFrom) < 0
  ) {
    return false;
  }

  if (filters.eventDateTo && row.event_date.localeCompare(filters.eventDateTo) > 0) {
    return false;
  }

  if (
    filters.fulfillmentMethod !== "all" &&
    row.fulfillment_method !== filters.fulfillmentMethod
  ) {
    return false;
  }

  if (filters.budgetRange !== "all" && budgetRangeValue !== filters.budgetRange) {
    return false;
  }

  if (filters.priority !== "all" && signals.priority !== filters.priority) {
    return false;
  }

  if (filters.urgency !== "all" && signals.urgency !== filters.urgency) {
    return false;
  }

  return true;
}

function mapListEntry(row: InquiryListQueryRow): InquiryListEntry {
  const items = [...(row.inquiry_items ?? [])].sort((left, right) => left.sort_order - right.sort_order);
  const signals = getInquirySignals(row.metadata);

  return {
    budgetRangeLabel: getBudgetRangeLabelForInquiry(row),
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    estimatedLabel: formatEstimateRange(row.estimated_min, row.estimated_max),
    eventDate: row.event_date,
    eventType: row.event_type,
    fulfillmentMethod: row.fulfillment_method,
    id: row.id,
    items: items.map((item) => ({
      id: item.id,
      productLabel: item.product_label || getProductDisplayLabel(item.product_type),
      productType: item.product_type,
      requestedQuantityLabel: formatRequestedQuantity(item),
      sortOrder: item.sort_order,
    })),
    priorityLabel: getSignalLabel(signals.priority, "Not scored yet"),
    priorityValue: signals.priority,
    referenceCode: getReferenceCode(row),
    reviewedAt: row.reviewed_at,
    sourceChannel: row.source_channel,
    status: row.status,
    submittedAt: row.submitted_at,
    urgencyLabel: getSignalLabel(signals.urgency, "Not scored yet"),
    urgencyValue: signals.urgency,
  };
}

export async function getInquiryListData(filters: InquiryListFilters): Promise<InquiryListData> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin inquiries.");
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "id, status, source_channel, customer_name, customer_email, customer_phone, event_type, event_date, fulfillment_method, budget_min, budget_max, estimated_min, estimated_max, submitted_at, reviewed_at, archived_at, created_at, updated_at, metadata, inquiry_items(id, product_type, product_label, quantity, servings, cupcake_count, cookie_count, macaron_count, kit_count, wedding_servings, sort_order)",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as InquiryListQueryRow[];
  const statusCounts = {
    approved: 0,
    archived: 0,
    declined: 0,
    new: 0,
    quoted: 0,
    reviewing: 0,
  } satisfies Record<Enums<"inquiry_status">, number>;

  rows.forEach((row) => {
    statusCounts[row.status] += 1;
  });

  const filteredRows = rows.filter((row) => matchesFilters(row, filters));
  const entries = filteredRows.map(mapListEntry);
  const rushCount = filteredRows.filter((row) => getInquirySignals(row.metadata).urgency === "rush").length;
  const newCount = filteredRows.filter((row) => row.status === "new").length;
  const deliveryCount = filteredRows.filter((row) => row.fulfillment_method === "delivery").length;
  const archivedCount = statusCounts.archived;

  return {
    entries,
    filters,
    statusCounts,
    summary: [
      {
        detail:
          filters.status === "active"
            ? archivedCount === 0
              ? "Archived inquiries stay out of the default desk."
              : `${archivedCount} archived inquir${archivedCount === 1 ? "y is" : "ies are"} hidden by default.`
            : rows.length === filteredRows.length
              ? "All inquiries currently shown"
              : `${rows.length} total inquiries in the system`,
        label: "Visible inquiries",
        value: String(filteredRows.length),
      },
      {
        detail: newCount === 0 ? "Nothing brand-new is waiting" : "Fresh leads that likely need a first response",
        label: "New to review",
        value: String(newCount),
      },
      {
        detail:
          rushCount === 0
            ? `${deliveryCount} delivery request${deliveryCount === 1 ? "" : "s"} in this view`
            : "Closest event dates based on the current availability urgency signal",
        label: rushCount === 0 ? "Deliveries in view" : "Rush inquiries",
        value: String(rushCount === 0 ? deliveryCount : rushCount),
      },
    ],
    totalCount: rows.length,
  };
}

function getDetailSummary(detailJson: Json) {
  const record = isRecord(detailJson) ? detailJson : null;
  return record ? getStringValue(record, "requestedSummary") : null;
}

async function createSignedUrlForAsset(asset: InquiryAssetQueryRow) {
  if (asset.asset_url) {
    return {
      accessState: "available" as const,
      note: null,
      signedUrl: asset.asset_url,
    };
  }

  if (asset.media_assets?.public_url) {
    return {
      accessState: "available" as const,
      note: null,
      signedUrl: asset.media_assets.public_url,
    };
  }

  if (!asset.media_assets?.bucket || !asset.media_assets.storage_path) {
    return {
      accessState: "limited" as const,
      note: "This upload is recorded, but the file path is not available for preview yet.",
      signedUrl: null,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(asset.media_assets.bucket)
    .createSignedUrl(asset.media_assets.storage_path, 60 * 15);

  if (error || !data?.signedUrl) {
    return {
      accessState: "limited" as const,
      note: "Preview could not be generated right now. The file may be private, moved, or missing.",
      signedUrl: null,
    };
  }

  return {
    accessState: "available" as const,
    note: "Private upload preview link expires after a short time for safety.",
    signedUrl: data.signedUrl,
  };
}

function mapNoteDisplay(row: InquiryNoteQueryRow): InquiryNoteDisplay {
  return {
    authorLabel:
      row.profiles?.full_name?.trim() ||
      row.profiles?.email?.trim() ||
      "Sweet Fork staff",
    createdAt: row.created_at,
    id: row.id,
    isPinned: row.is_pinned,
    noteBody: row.note_body,
    noteType: row.note_type,
  };
}

function mapItemDetail(row: InquiryItemDetailRow): InquiryItemDetail {
  return {
    colorPalette: row.color_palette,
    designNotes: row.design_notes,
    detailSummary: getDetailSummary(row.detail_json),
    estimatedLabel: formatEstimateRange(row.estimated_min, row.estimated_max),
    flavorNotes: row.flavor_notes,
    icingStyleLabel: row.icing_style ? toTitleCase(row.icing_style) : null,
    id: row.id,
    inspirationNotes: row.inspiration_notes,
    productLabel: row.product_label || getProductDisplayLabel(row.product_type),
    productType: row.product_type,
    requestedQuantityLabel: formatRequestedQuantity(row),
    shapeLabel: row.shape ? toTitleCase(row.shape) : null,
    sizeLabel: row.size_label,
    sortOrder: row.sort_order,
    topperText: row.topper_text,
  };
}

export async function getInquiryDetail(inquiryId: string): Promise<InquiryDetail | null> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin inquiries.");
  }

  const inquiryPromise = supabase
    .from("inquiries")
    .select("*")
    .eq("id", inquiryId)
    .maybeSingle();
  const itemsPromise = supabase
    .from("inquiry_items")
    .select(
      "id, inquiry_id, product_type, product_label, quantity, servings, flavor_notes, design_notes, inspiration_notes, size_label, tiers, shape, icing_style, cupcake_count, cookie_count, macaron_count, kit_count, wedding_servings, topper_text, color_palette, estimated_min, estimated_max, detail_json, sort_order, created_at, updated_at",
    )
    .eq("inquiry_id", inquiryId)
    .order("sort_order", { ascending: true });
  const assetsPromise = supabase
    .from("inquiry_assets")
    .select(
      "id, inquiry_id, inquiry_item_id, media_asset_id, asset_type, label, asset_url, external_url, text_content, sort_order, metadata, created_at, updated_at, media_assets(id, bucket, storage_path, original_filename, mime_type, public_url, asset_kind)",
    )
    .eq("inquiry_id", inquiryId)
    .order("sort_order", { ascending: true });
  const notesPromise = supabase
    .from("inquiry_notes")
    .select(
      "id, inquiry_id, author_profile_id, note_type, note_body, is_pinned, created_at, updated_at, profiles(id, full_name, email)",
    )
    .eq("inquiry_id", inquiryId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const [
    { data: inquiryData, error: inquiryError },
    { data: itemData, error: itemsError },
    { data: assetData, error: assetsError },
    { data: noteData, error: notesError },
  ] = await Promise.all([inquiryPromise, itemsPromise, assetsPromise, notesPromise]);

  if (inquiryError) {
    throw inquiryError;
  }

  if (itemsError) {
    throw itemsError;
  }

  if (assetsError) {
    throw assetsError;
  }

  if (notesError) {
    throw notesError;
  }

  if (!inquiryData) {
    return null;
  }

  const inquiry = inquiryData as InquiryDetailQueryRow;
  const itemRows = (itemData ?? []) as InquiryItemDetailRow[];
  const items = itemRows.map(mapItemDetail);
  const notes = ((noteData ?? []) as InquiryNoteQueryRow[]).map(mapNoteDisplay);
  const assetDisplays = await Promise.all(
    ((assetData ?? []) as InquiryAssetQueryRow[]).map(async (asset) => {
      const signedAsset = await createSignedUrlForAsset(asset);

      return {
        accessState: signedAsset.accessState,
        assetType: asset.asset_type,
        createdAt: asset.created_at,
        id: asset.id,
        inquiryItemId: asset.inquiry_item_id,
        label:
          asset.label ||
          asset.media_assets?.original_filename ||
          (asset.asset_type === "image-upload"
            ? "Inspiration upload"
            : asset.asset_type === "reference-link"
              ? "Reference link"
              : "Reference note"),
        mimeType: asset.media_assets?.mime_type ?? null,
        note: signedAsset.note,
        originalFilename: asset.media_assets?.original_filename ?? null,
        signedUrl: signedAsset.signedUrl,
        textContent: asset.text_content,
        url: asset.external_url,
      } satisfies InquiryAssetDisplay;
    }),
  );
  const signals = getInquirySignals(inquiry.metadata);
  const uploads = assetDisplays.filter((asset) => asset.assetType === "image-upload");
  const inspirationLinks = assetDisplays.filter((asset) => asset.assetType === "reference-link");
  const inspirationTextBlocks = assetDisplays.filter((asset) => asset.assetType === "reference-text");

  if (
    inquiry.inspiration_text &&
    !inspirationTextBlocks.some((asset) => asset.textContent === inquiry.inspiration_text)
  ) {
    inspirationTextBlocks.push({
      accessState: "available",
      assetType: "reference-text",
      createdAt: inquiry.created_at,
      id: `${inquiry.id}-inspiration-text`,
      inquiryItemId: null,
      label: "Inspiration notes",
      mimeType: null,
      note: null,
      originalFilename: null,
      signedUrl: null,
      textContent: inquiry.inspiration_text,
      url: null,
    });
  }

  return {
    additionalNotes: inquiry.additional_notes,
    archivedAt: inquiry.archived_at,
    assets: assetDisplays,
    budgetLabel: getBudgetRangeLabelForInquiry(inquiry),
    clarityLabel: getSignalLabel(signals.clarity, "Awaiting a fuller scoring pass"),
    clarityValue: signals.clarity,
    colorPalette: inquiry.color_palette,
    contact: {
      customerEmail: inquiry.customer_email,
      customerName: inquiry.customer_name,
      customerPhone: inquiry.customer_phone,
      instagramHandle: inquiry.instagram_handle,
      preferredContact: inquiry.preferred_contact,
    },
    convertToOrderNote:
      "This will connect the inquiry to a customer and order record in the next phase. For now, use the notes and status sections to keep review moving.",
    dietaryNotes: inquiry.dietary_notes,
    estimateInsight: buildEstimateInsight(inquiry, itemRows),
    estimatedLabel: formatEstimateRange(inquiry.estimated_min, inquiry.estimated_max),
    event: {
      deliveryWindow: inquiry.delivery_window,
      eventDate: inquiry.event_date,
      eventTime: inquiry.event_time,
      eventType: inquiry.event_type,
      fulfillmentMethod: inquiry.fulfillment_method,
      guestCount: inquiry.guest_count,
      servingTarget: inquiry.serving_target,
      venueAddress: inquiry.venue_address,
      venueName: inquiry.venue_name,
    },
    howDidYouHear: inquiry.how_did_you_hear,
    id: inquiry.id,
    inspirationLinks,
    inspirationTextBlocks,
    internalSummary: inquiry.internal_summary,
    items,
    notes,
    priorityLabel: getSignalLabel(signals.priority, "Awaiting a fuller scoring pass"),
    priorityValue: signals.priority,
    referenceCode: getReferenceCode(inquiry),
    reviewedAt: inquiry.reviewed_at,
    sourceChannel: inquiry.source_channel,
    status: inquiry.status,
    submittedAt: inquiry.submitted_at,
    timestamps: [
      { label: "Submitted", value: inquiry.submitted_at },
      { label: "Reviewed", value: inquiry.reviewed_at },
      { label: "Updated", value: inquiry.updated_at },
      { label: "Archived", value: inquiry.archived_at },
    ],
    urgencyLabel: getSignalLabel(signals.urgency, "Awaiting a fuller scoring pass"),
    urgencyValue: signals.urgency,
    uploads,
  };
}
