import "server-only";

import { createClient as createSessionClient } from "@/lib/supabase/server";
import {
  calculateOrderPaymentSnapshot,
  formatOrderMoneySummary,
  getInquiryReferenceCode,
  getPaymentMethodLabel,
  getPaymentUiLabel,
  getPaymentUiType,
  getRepeatCustomerValue,
  getRequestedQuantityLabel,
  parseOrderWorkflowMetadata,
  type OrderPaymentSnapshot,
} from "@/lib/admin/order-workflow";
import { toTitleCase } from "@/lib/utils";
import type { Enums, Json, Tables } from "@/types/supabase.generated";

type CustomerRow = Tables<"customers">;
type InquiryRow = Tables<"inquiries">;
type OrderItemRow = Tables<"order_items">;
type OrderNoteRow = Tables<"order_notes">;
type OrderRow = Tables<"orders">;
type PaymentRow = Tables<"payments">;
type ProfileRow = Tables<"profiles">;

type OrderListQueryRow = Pick<
  OrderRow,
  | "balance_due_amount"
  | "created_at"
  | "deposit_due_amount"
  | "event_date"
  | "event_type"
  | "fulfillment_method"
  | "id"
  | "payment_status"
  | "status"
  | "total_amount"
  | "updated_at"
> & {
  customers: Pick<CustomerRow, "email" | "full_name" | "id" | "phone"> | null;
  inquiries: Pick<InquiryRow, "id" | "metadata"> | null;
  order_items: Array<Pick<OrderItemRow, "id">> | null;
  payments: Array<Pick<PaymentRow, "amount" | "payment_type" | "status">> | null;
};

type CustomerRepeatSummaryQueryRow = Pick<CustomerRow, "id"> & {
  inquiries: Array<Pick<InquiryRow, "id">> | null;
  orders: Array<Pick<OrderRow, "id">> | null;
};

type OrderItemDetailRow = Pick<
  OrderItemRow,
  | "color_palette"
  | "cookie_count"
  | "cupcake_count"
  | "design_notes"
  | "detail_json"
  | "flavor_notes"
  | "icing_style"
  | "id"
  | "inquiry_item_id"
  | "kit_count"
  | "kitchen_notes"
  | "line_total"
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
  | "unit_price"
  | "wedding_servings"
>;

type PaymentDetailRow = Pick<
  PaymentRow,
  | "amount"
  | "currency_code"
  | "due_at"
  | "id"
  | "method"
  | "notes"
  | "paid_at"
  | "payment_type"
  | "provider_intent_id"
  | "provider_name"
  | "reference_code"
  | "status"
>;

type OrderNoteDetailRow = Pick<
  OrderNoteRow,
  "created_at" | "id" | "is_pinned" | "note_body" | "note_type"
> & {
  profiles: Pick<ProfileRow, "email" | "full_name" | "id"> | null;
};

type OrderDetailQueryRow = Pick<
  OrderRow,
  | "balance_due_amount"
  | "cancelled_at"
  | "completed_at"
  | "confirmed_at"
  | "created_at"
  | "customer_id"
  | "delivery_address"
  | "delivery_fee"
  | "deposit_due_amount"
  | "deposit_due_at"
  | "discount_amount"
  | "due_at"
  | "event_date"
  | "event_type"
  | "final_due_at"
  | "fulfilled_at"
  | "fulfillment_method"
  | "fulfillment_window"
  | "id"
  | "inquiry_id"
  | "internal_summary"
  | "metadata"
  | "payment_status"
  | "production_notes"
  | "quoted_at"
  | "status"
  | "subtotal_amount"
  | "tax_amount"
  | "total_amount"
  | "updated_at"
  | "venue_address"
  | "venue_name"
> & {
  customers:
    | Pick<
        CustomerRow,
        | "email"
        | "full_name"
        | "id"
        | "instagram_handle"
        | "phone"
        | "preferred_contact"
      >
    | null;
  inquiries:
    | Pick<
        InquiryRow,
        "customer_email" | "customer_name" | "event_date" | "id" | "metadata" | "status" | "submitted_at"
      >
    | null;
  order_items: OrderItemDetailRow[] | null;
  order_notes: OrderNoteDetailRow[] | null;
  payments: PaymentDetailRow[] | null;
};

type InquiryConversionInquiryRow = Pick<
  InquiryRow,
  | "customer_email"
  | "customer_id"
  | "customer_name"
  | "customer_phone"
  | "event_date"
  | "event_type"
  | "fulfillment_method"
  | "id"
  | "metadata"
  | "status"
>;

type InquiryConversionOrderRow = Pick<OrderRow, "id" | "payment_status" | "status">;

type InquiryConversionCustomerRow = Pick<
  CustomerRow,
  | "email"
  | "full_name"
  | "id"
  | "last_inquiry_at"
  | "last_order_at"
  | "phone"
  | "preferred_contact"
>;

export type OrderListFilters = {
  eventDateFrom: string;
  eventDateTo: string;
  fulfillmentMethod: Enums<"fulfillment_method"> | "all";
  paymentState: Enums<"payment_status"> | "all";
  search: string;
  status: Enums<"order_status"> | "all";
};

export type OrderListEntry = {
  balanceDueLabel: string;
  customerId: string | null;
  customerLabel: string;
  eventDate: string;
  eventType: string;
  fulfillmentMethod: Enums<"fulfillment_method">;
  id: string;
  itemCount: number;
  paymentState: Enums<"payment_status">;
  paymentStateLabel: string;
  referenceCode: string;
  status: Enums<"order_status">;
  totalLabel: string;
};

export type OrderListData = {
  entries: OrderListEntry[];
  filters: OrderListFilters;
  summary: Array<{
    detail: string;
    label: string;
    value: string;
  }>;
  totalCount: number;
};

export type InquiryConversionCustomerOption = {
  email: string | null;
  id: string;
  isLinked: boolean;
  isSuggested: boolean;
  label: string;
  note: string;
  phone: string | null;
};

export type InquiryConversionData = {
  customerOptions: InquiryConversionCustomerOption[];
  defaultCustomerId: string | null;
  existingOrder: {
    id: string;
    paymentStatus: Enums<"payment_status">;
    status: Enums<"order_status">;
  } | null;
  linkedCustomer: InquiryConversionCustomerOption | null;
  matchedCustomerIds: string[];
  suggestedOrderStatus: Enums<"order_status">;
};

export type OrderItemDisplay = {
  colorPalette: string | null;
  designNotes: string | null;
  detailSummary: string | null;
  flavorNotes: string | null;
  id: string;
  kitchenNotes: string | null;
  lineTotal: number | null;
  productLabel: string;
  quantityLabel: string;
  sizeLabel: string | null;
  sortOrder: number;
  topperText: string | null;
  unitPrice: number | null;
};

export type OrderPaymentDisplay = {
  amount: number;
  dueAt: string | null;
  id: string;
  method: Enums<"payment_method">;
  methodLabel: string;
  notes: string | null;
  paidAt: string | null;
  providerIntentId: string | null;
  providerName: string | null;
  referenceCode: string | null;
  status: Enums<"payment_record_status">;
  type: Enums<"payment_type">;
  typeLabel: string;
  uiType: "deposit" | "final" | "other";
};

export type OrderNoteDisplay = {
  authorLabel: string;
  createdAt: string;
  id: string;
  isPinned: boolean;
  noteBody: string;
  noteType: Enums<"internal_note_type">;
};

export type OrderDetail = {
  balanceDueAmount: number;
  customer: {
    email: string | null;
    fullName: string;
    id: string;
    instagramHandle: string | null;
    phone: string | null;
    preferredContact: Enums<"contact_preference">;
  } | null;
  deliveryAddress: string | null;
  deliveryFee: number;
  depositDueAmount: number;
  depositDueAt: string | null;
  discountAmount: number;
  estimatedTotalAmount: number | null;
  eventDate: string;
  eventType: string;
  finalDueAt: string | null;
  fulfillmentMethod: Enums<"fulfillment_method">;
  fulfillmentNotes: string | null;
  fulfillmentWindow: string | null;
  id: string;
  inquiry: {
    customerEmail: string;
    customerName: string;
    eventDate: string;
    id: string;
    referenceCode: string;
    status: Enums<"inquiry_status">;
    submittedAt: string;
  } | null;
  internalSummary: string | null;
  items: OrderItemDisplay[];
  notes: OrderNoteDisplay[];
  paymentStatus: Enums<"payment_status">;
  paymentSummary: OrderPaymentSnapshot;
  payments: OrderPaymentDisplay[];
  productionNotes: string | null;
  squareInvoiceNumber: string | null;
  squareInvoiceStatus: string | null;
  squareInvoiceUrl: string | null;
  status: Enums<"order_status">;
  subtotalAmount: number;
  taxAmount: number;
  timestamps: Array<{
    label: string;
    value: string | null;
  }>;
  totalAmount: number;
  venueAddress: string | null;
  venueName: string | null;
  workflowDesignNotes: string | null;
};

const DEFAULT_ORDER_LIST_FILTERS: OrderListFilters = {
  eventDateFrom: "",
  eventDateTo: "",
  fulfillmentMethod: "all",
  paymentState: "all",
  search: "",
  status: "all",
};

function normalizeFilterValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isRecord(value: Json | null | undefined): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(record: Record<string, Json>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getDetailSummary(detailJson: Json) {
  const record = isRecord(detailJson) ? detailJson : null;
  return record ? getStringValue(record, "requestedSummary") : null;
}

function normalizePhone(value: string | null | undefined) {
  return value ? value.replace(/\D/g, "") : "";
}

function getCustomerOptionNote(customer: InquiryConversionCustomerRow) {
  const parts = [customer.email, customer.phone].filter(Boolean);
  const recency = customer.last_order_at ?? customer.last_inquiry_at;

  if (recency) {
    parts.push(`Last active ${recency.slice(0, 10)}`);
  }

  return parts.join(" • ") || "No extra contact details yet";
}

function getSuggestedOrderStatus(
  inquiryStatus: Enums<"inquiry_status">,
): Enums<"order_status"> {
  switch (inquiryStatus) {
    case "approved":
      return "confirmed";
    case "quoted":
      return "quoted";
    default:
      return "draft";
  }
}

function buildPaymentLabel(
  paymentType: Enums<"payment_type">,
  amount: number,
) {
  return `${getPaymentUiLabel(getPaymentUiType(paymentType))} • ${formatOrderMoneySummary(amount)}`;
}

function mapOrderNote(row: OrderNoteDetailRow): OrderNoteDisplay {
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

function mapOrderItem(row: OrderItemDetailRow): OrderItemDisplay {
  return {
    colorPalette: row.color_palette,
    designNotes: row.design_notes,
    detailSummary: getDetailSummary(row.detail_json),
    flavorNotes: row.flavor_notes,
    id: row.id,
    kitchenNotes: row.kitchen_notes,
    lineTotal: row.line_total,
    productLabel: row.product_label,
    quantityLabel: getRequestedQuantityLabel(row),
    sizeLabel: row.size_label
      ? [row.size_label, row.tiers ? `${row.tiers} tier${row.tiers === 1 ? "" : "s"}` : null]
          .filter(Boolean)
          .join(" • ")
      : row.tiers
        ? `${row.tiers} tier${row.tiers === 1 ? "" : "s"}`
        : null,
    sortOrder: row.sort_order,
    topperText: row.topper_text,
    unitPrice: row.unit_price,
  };
}

function mapOrderPayment(row: PaymentDetailRow): OrderPaymentDisplay {
  const uiType = getPaymentUiType(row.payment_type);

  return {
    amount: row.amount,
    dueAt: row.due_at,
    id: row.id,
    method: row.method,
    methodLabel: getPaymentMethodLabel(row.method),
    notes: row.notes,
    paidAt: row.paid_at,
    providerIntentId: row.provider_intent_id,
    providerName: row.provider_name,
    referenceCode: row.reference_code,
    status: row.status,
    type: row.payment_type,
    typeLabel: buildPaymentLabel(row.payment_type, row.amount),
    uiType,
  };
}

export function parseOrderListFilters(
  rawSearchParams: Record<string, string | string[] | undefined>,
): OrderListFilters {
  const next: OrderListFilters = { ...DEFAULT_ORDER_LIST_FILTERS };

  const search = normalizeFilterValue(rawSearchParams.search).trim();
  if (search.length > 0) {
    next.search = search;
  }

  const status = normalizeFilterValue(rawSearchParams.status);
  if (
    status &&
    ["draft", "quoted", "confirmed", "in-production", "fulfilled", "completed", "cancelled"].includes(
      status,
    )
  ) {
    next.status = status as OrderListFilters["status"];
  }

  const paymentState = normalizeFilterValue(rawSearchParams.paymentState);
  if (paymentState && ["unpaid", "deposit-paid", "paid", "refunded"].includes(paymentState)) {
    next.paymentState = paymentState as OrderListFilters["paymentState"];
  }

  const fulfillmentMethod = normalizeFilterValue(rawSearchParams.fulfillmentMethod);
  if (fulfillmentMethod === "pickup" || fulfillmentMethod === "delivery") {
    next.fulfillmentMethod = fulfillmentMethod;
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

export async function getInquiryConversionData(
  inquiryId: string,
): Promise<InquiryConversionData | null> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin orders.");
  }

  const inquiryPromise = supabase
    .from("inquiries")
    .select(
      "id, customer_id, customer_name, customer_email, customer_phone, event_date, event_type, fulfillment_method, metadata, status",
    )
    .eq("id", inquiryId)
    .maybeSingle();
  const orderPromise = supabase
    .from("orders")
    .select("id, status, payment_status")
    .eq("inquiry_id", inquiryId)
    .maybeSingle();
  const customersPromise = supabase
    .from("customers")
    .select(
      "id, full_name, email, phone, preferred_contact, last_order_at, last_inquiry_at",
    )
    .order("last_order_at", { ascending: false, nullsFirst: false })
    .order("full_name", { ascending: true });

  const [
    { data: inquiryData, error: inquiryError },
    { data: orderData, error: orderError },
    { data: customerData, error: customersError },
  ] = await Promise.all([inquiryPromise, orderPromise, customersPromise]);

  if (inquiryError) {
    throw inquiryError;
  }

  if (orderError) {
    throw orderError;
  }

  if (customersError) {
    throw customersError;
  }

  if (!inquiryData) {
    return null;
  }

  const inquiry = inquiryData as InquiryConversionInquiryRow;
  const existingOrder = orderData as InquiryConversionOrderRow | null;
  const customers = (customerData ?? []) as InquiryConversionCustomerRow[];
  const normalizedName = inquiry.customer_name.trim().toLowerCase();
  const normalizedEmail = inquiry.customer_email.trim().toLowerCase();
  const normalizedPhone = normalizePhone(inquiry.customer_phone);

  const matchedCustomerIds = customers
    .filter((customer) => {
      const emailMatch =
        normalizedEmail.length > 0 &&
        customer.email?.trim().toLowerCase() === normalizedEmail;
      const phoneMatch =
        normalizedPhone.length > 0 && normalizePhone(customer.phone) === normalizedPhone;
      const nameMatch =
        normalizedName.length > 0 &&
        customer.full_name.trim().toLowerCase() === normalizedName;

      return emailMatch || phoneMatch || nameMatch;
    })
    .map((customer) => customer.id);

  const customerOptions = customers.map((customer) => ({
    email: customer.email,
    id: customer.id,
    isLinked: inquiry.customer_id === customer.id,
    isSuggested: matchedCustomerIds.includes(customer.id),
    label: customer.full_name,
    note: getCustomerOptionNote(customer),
    phone: customer.phone,
  }));

  const sortedOptions = customerOptions.toSorted((left, right) => {
    if (left.isLinked !== right.isLinked) {
      return left.isLinked ? -1 : 1;
    }

    if (left.isSuggested !== right.isSuggested) {
      return left.isSuggested ? -1 : 1;
    }

    return left.label.localeCompare(right.label);
  });

  return {
    customerOptions: sortedOptions,
    defaultCustomerId: inquiry.customer_id ?? matchedCustomerIds[0] ?? null,
    existingOrder: existingOrder
      ? {
          id: existingOrder.id,
          paymentStatus: existingOrder.payment_status,
          status: existingOrder.status,
        }
      : null,
    linkedCustomer: sortedOptions.find((customer) => customer.isLinked) ?? null,
    matchedCustomerIds,
    suggestedOrderStatus: getSuggestedOrderStatus(inquiry.status),
  };
}

export async function getOrderListData(filters: OrderListFilters): Promise<OrderListData> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin orders.");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, payment_status, fulfillment_method, event_type, event_date, total_amount, balance_due_amount, deposit_due_amount, created_at, updated_at, customers(id, full_name, email, phone), inquiries(id, metadata), order_items(id), payments(amount, payment_type, status)",
    )
    .order("event_date", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as OrderListQueryRow[];
  const entries = rows
    .map((row) => {
      const paymentSummary = calculateOrderPaymentSnapshot(row, row.payments ?? []);
      const paymentState = paymentSummary.paymentStatus || row.payment_status;

      return {
        balanceDueLabel: formatOrderMoneySummary(paymentSummary.balanceDue),
        customerId: row.customers?.id ?? null,
        customerLabel: row.customers?.full_name ?? "Unknown customer",
        eventDate: row.event_date,
        eventType: row.event_type,
        fulfillmentMethod: row.fulfillment_method,
        id: row.id,
        itemCount: row.order_items?.length ?? 0,
        paymentState,
        paymentStateLabel: toTitleCase(paymentState),
        referenceCode: row.inquiries
          ? getInquiryReferenceCode(row.inquiries)
          : `ORD-${row.id.slice(0, 8).toUpperCase()}`,
        status: row.status,
        totalLabel: formatOrderMoneySummary(row.total_amount),
      } satisfies OrderListEntry;
    })
    .filter((entry) => {
      if (filters.status !== "all" && entry.status !== filters.status) {
        return false;
      }

      if (filters.paymentState !== "all" && entry.paymentState !== filters.paymentState) {
        return false;
      }

      if (
        filters.fulfillmentMethod !== "all" &&
        entry.fulfillmentMethod !== filters.fulfillmentMethod
      ) {
        return false;
      }

      if (filters.eventDateFrom && entry.eventDate < filters.eventDateFrom) {
        return false;
      }

      if (filters.eventDateTo && entry.eventDate > filters.eventDateTo) {
        return false;
      }

      if (filters.search.length === 0) {
        return true;
      }

      const haystack = [
        entry.customerLabel,
        entry.eventType,
        entry.referenceCode,
        entry.totalLabel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(filters.search.toLowerCase());
    });

  const awaitingPaymentCount = entries.filter((entry) => entry.paymentState !== "paid").length;
  const upcomingCount = entries.filter((entry) => {
    const today = new Date().toISOString().slice(0, 10);
    return entry.eventDate >= today;
  }).length;

  return {
    entries,
    filters,
    summary: [
      {
        detail: rows.length === entries.length ? "All active orders currently shown" : `${rows.length} total orders in the system`,
        label: "Visible orders",
        value: String(entries.length),
      },
      {
        detail:
          awaitingPaymentCount === 0
            ? "Nothing in this view is waiting on money right now"
            : "Orders that still need a deposit, final payment, or manual follow-up",
        label: "Awaiting payment",
        value: String(awaitingPaymentCount),
      },
      {
        detail:
          upcomingCount === 0
            ? "No upcoming event dates in the current view"
            : "Orders with event dates still ahead",
        label: "Upcoming orders",
        value: String(upcomingCount),
      },
    ],
    totalCount: rows.length,
  };
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin orders.");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_id, inquiry_id, status, payment_status, fulfillment_method, event_type, event_date, due_at, venue_name, venue_address, fulfillment_window, delivery_address, subtotal_amount, discount_amount, delivery_fee, tax_amount, total_amount, deposit_due_amount, balance_due_amount, deposit_due_at, final_due_at, internal_summary, production_notes, quoted_at, confirmed_at, fulfilled_at, completed_at, cancelled_at, metadata, created_at, updated_at, customers(id, full_name, email, phone, preferred_contact, instagram_handle), inquiries(id, customer_name, customer_email, status, submitted_at, event_date, metadata), order_items(id, inquiry_item_id, product_type, product_label, quantity, sort_order, servings, size_label, tiers, shape, icing_style, cupcake_count, cookie_count, macaron_count, kit_count, wedding_servings, flavor_notes, design_notes, kitchen_notes, topper_text, color_palette, unit_price, line_total, detail_json), payments(id, payment_type, status, amount, method, currency_code, due_at, paid_at, reference_code, provider_name, provider_intent_id, notes), order_notes(id, note_type, note_body, is_pinned, created_at, profiles(id, full_name, email))",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as OrderDetailQueryRow;
  const workflowMetadata = parseOrderWorkflowMetadata(row.metadata);
  const items = (row.order_items ?? []).map(mapOrderItem);
  const payments = (row.payments ?? []).map(mapOrderPayment);
  const paymentSummary = calculateOrderPaymentSnapshot(row, row.payments ?? []);
  const notes = (row.order_notes ?? []).map(mapOrderNote);

  return {
    balanceDueAmount: paymentSummary.balanceDue,
    customer: row.customers
      ? {
          email: row.customers.email,
          fullName: row.customers.full_name,
          id: row.customers.id,
          instagramHandle: row.customers.instagram_handle,
          phone: row.customers.phone,
          preferredContact: row.customers.preferred_contact,
        }
      : null,
    deliveryAddress: row.delivery_address,
    deliveryFee: row.delivery_fee,
    depositDueAmount: row.deposit_due_amount,
    depositDueAt: row.deposit_due_at,
    discountAmount: row.discount_amount,
    estimatedTotalAmount: workflowMetadata.estimatedTotalAmount,
    eventDate: row.event_date,
    eventType: row.event_type,
    finalDueAt: row.final_due_at,
    fulfillmentMethod: row.fulfillment_method,
    fulfillmentNotes: workflowMetadata.fulfillmentNotes,
    fulfillmentWindow: row.fulfillment_window,
    id: row.id,
    inquiry: row.inquiries
      ? {
          customerEmail: row.inquiries.customer_email,
          customerName: row.inquiries.customer_name,
          eventDate: row.inquiries.event_date,
          id: row.inquiries.id,
          referenceCode: getInquiryReferenceCode(row.inquiries),
          status: row.inquiries.status,
          submittedAt: row.inquiries.submitted_at,
        }
      : null,
    internalSummary: row.internal_summary,
    items,
    notes,
    paymentStatus: paymentSummary.paymentStatus,
    paymentSummary,
    payments,
    productionNotes: row.production_notes,
    squareInvoiceNumber: workflowMetadata.squareInvoiceNumber,
    squareInvoiceStatus: workflowMetadata.squareInvoiceStatus,
    squareInvoiceUrl: workflowMetadata.squareInvoiceUrl,
    status: row.status,
    subtotalAmount: row.subtotal_amount,
    taxAmount: row.tax_amount,
    timestamps: [
      { label: "Created", value: row.created_at },
      { label: "Updated", value: row.updated_at },
      { label: "Quoted", value: row.quoted_at },
      { label: "Confirmed", value: row.confirmed_at },
      { label: "Fulfilled", value: row.fulfilled_at },
      { label: "Completed", value: row.completed_at },
      { label: "Cancelled", value: row.cancelled_at },
    ],
    totalAmount: row.total_amount,
    venueAddress: row.venue_address,
    venueName: row.venue_name,
    workflowDesignNotes: workflowMetadata.designNotes,
  };
}

export async function getRepeatCustomerSummary(customerId: string) {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin orders.");
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, orders(id), inquiries(id)")
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as CustomerRepeatSummaryQueryRow;
  const orderCount = (row.orders ?? []).length;
  const inquiryCount = (row.inquiries ?? []).length;

  return {
    inquiryCount,
    isRepeat: getRepeatCustomerValue(orderCount, inquiryCount),
    orderCount,
  };
}
