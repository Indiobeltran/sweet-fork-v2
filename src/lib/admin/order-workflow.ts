import { formatCurrency, toTitleCase } from "@/lib/utils";
import type { Enums, Json, Tables } from "@/types/supabase.generated";

type InquiryRow = Tables<"inquiries">;
type OrderRow = Tables<"orders">;
type PaymentRow = Tables<"payments">;

type JsonRecord = Record<string, Json>;

type QuantitySummaryLike = {
  cookie_count: number | null;
  cupcake_count: number | null;
  kit_count: number | null;
  macaron_count: number | null;
  product_type: Enums<"product_type">;
  quantity: number;
  servings: number | null;
  wedding_servings: number | null;
};

export type OrderWorkflowMetadata = {
  designNotes: string | null;
  estimatedTotalAmount: number | null;
  fulfillmentNotes: string | null;
  squareInvoiceNumber: string | null;
  squareInvoiceStatus: string | null;
  squareInvoiceUrl: string | null;
};

export type PaymentUiType = "deposit" | "final" | "other";

export type OrderPaymentSnapshot = {
  balanceDue: number;
  depositPaid: number;
  finalPaid: number;
  otherPaid: number;
  paymentStatus: Enums<"payment_status">;
  refundTotal: number;
  totalPaid: number;
};

function isRecord(value: Json | null | undefined): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(record: JsonRecord, key: string) {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getNumberValue(record: JsonRecord, key: string) {
  const value = record[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function setOptionalNumber(record: JsonRecord, key: string, value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    delete record[key];
    return;
  }

  record[key] = value;
}

function setOptionalString(record: JsonRecord, key: string, value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    delete record[key];
    return;
  }

  record[key] = value.trim();
}

function getReferenceCodeFallback(inquiryId: string) {
  return `SF-${inquiryId.slice(0, 8).toUpperCase()}`;
}

export function getInquiryReferenceCode(row: Pick<InquiryRow, "id" | "metadata">) {
  const metadata = isRecord(row.metadata) ? row.metadata : null;

  if (!metadata) {
    return getReferenceCodeFallback(row.id);
  }

  return getStringValue(metadata, "referenceCode") ?? getReferenceCodeFallback(row.id);
}

export function parseOrderWorkflowMetadata(metadata: Json): OrderWorkflowMetadata {
  const record = isRecord(metadata) ? metadata : null;

  if (!record) {
    return {
      designNotes: null,
      estimatedTotalAmount: null,
      fulfillmentNotes: null,
      squareInvoiceNumber: null,
      squareInvoiceStatus: null,
      squareInvoiceUrl: null,
    };
  }

  return {
    designNotes: getStringValue(record, "designNotes"),
    estimatedTotalAmount: getNumberValue(record, "estimatedTotalAmount"),
    fulfillmentNotes: getStringValue(record, "fulfillmentNotes"),
    squareInvoiceNumber: getStringValue(record, "squareInvoiceNumber"),
    squareInvoiceStatus: getStringValue(record, "squareInvoiceStatus"),
    squareInvoiceUrl: getStringValue(record, "squareInvoiceUrl"),
  };
}

export function mergeOrderWorkflowMetadata(
  current: Json,
  next: Partial<OrderWorkflowMetadata>,
): Json {
  const record: JsonRecord = isRecord(current) ? { ...current } : {};

  setOptionalString(record, "designNotes", next.designNotes);
  setOptionalNumber(record, "estimatedTotalAmount", next.estimatedTotalAmount);
  setOptionalString(record, "fulfillmentNotes", next.fulfillmentNotes);
  setOptionalString(record, "squareInvoiceNumber", next.squareInvoiceNumber);
  setOptionalString(record, "squareInvoiceStatus", next.squareInvoiceStatus);
  setOptionalString(record, "squareInvoiceUrl", next.squareInvoiceUrl);

  return record;
}

export function getRequestedQuantityLabel(item: QuantitySummaryLike) {
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

export function formatCurrencyDetailed(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(value);
}

export function formatOptionalDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function getOrderStatusClasses(status: Enums<"order_status">) {
  switch (status) {
    case "draft":
      return "border-charcoal/12 bg-white text-charcoal/78";
    case "quoted":
      return "border-gold/25 bg-gold/12 text-charcoal";
    case "confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "in-production":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "fulfilled":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "cancelled":
      return "border-stone/18 bg-stone/10 text-charcoal";
    default:
      return "border-charcoal/12 bg-white text-charcoal/78";
  }
}

export function getPaymentStatusClasses(status: Enums<"payment_status">) {
  switch (status) {
    case "unpaid":
      return "border-charcoal/12 bg-white text-charcoal/78";
    case "deposit-paid":
      return "border-gold/25 bg-gold/12 text-charcoal";
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "refunded":
      return "border-stone/18 bg-stone/10 text-charcoal";
    default:
      return "border-charcoal/12 bg-white text-charcoal/78";
  }
}

export function getPaymentRecordStatusClasses(status: Enums<"payment_record_status">) {
  switch (status) {
    case "pending":
      return "border-charcoal/12 bg-white text-charcoal/72";
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "failed":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "refunded":
      return "border-stone/18 bg-stone/10 text-charcoal";
    case "voided":
      return "border-charcoal/8 bg-charcoal/5 text-charcoal/58";
    default:
      return "border-charcoal/12 bg-white text-charcoal/72";
  }
}

export function getPaymentUiType(value: Enums<"payment_type">): PaymentUiType {
  switch (value) {
    case "deposit":
      return "deposit";
    case "balance":
    case "full":
      return "final";
    case "adjustment":
    case "refund":
      return "other";
    default:
      return "other";
  }
}

export function getPaymentUiLabel(value: PaymentUiType) {
  switch (value) {
    case "deposit":
      return "Deposit";
    case "final":
      return "Final";
    case "other":
      return "Other";
    default:
      return toTitleCase(value);
  }
}

export function getStoredPaymentType(value: string): Enums<"payment_type"> | null {
  switch (value) {
    case "deposit":
      return "deposit";
    case "final":
      return "balance";
    case "other":
      return "adjustment";
    default:
      return null;
  }
}

export function getPaymentMethodLabel(value: Enums<"payment_method">) {
  switch (value) {
    case "bank-transfer":
      return "Bank transfer";
    default:
      return toTitleCase(value);
  }
}

export function calculateOrderPaymentSnapshot(
  order: Pick<OrderRow, "deposit_due_amount" | "total_amount">,
  payments: Array<Pick<PaymentRow, "amount" | "payment_type" | "status">>,
): OrderPaymentSnapshot {
  let depositPaid = 0;
  let finalPaid = 0;
  let otherPaid = 0;
  let refundTotal = 0;

  payments.forEach((payment) => {
    if (payment.status === "paid") {
      if (payment.payment_type === "deposit") {
        depositPaid += payment.amount;
        return;
      }

      if (payment.payment_type === "balance" || payment.payment_type === "full") {
        finalPaid += payment.amount;
        return;
      }

      if (payment.payment_type === "refund") {
        refundTotal += payment.amount;
        return;
      }

      otherPaid += payment.amount;
      return;
    }

    if (payment.status === "refunded") {
      refundTotal += payment.amount;
    }
  });

  const totalPaid = depositPaid + finalPaid + otherPaid - refundTotal;
  const balanceDue = Math.max(order.total_amount - totalPaid, 0);

  let paymentStatus: Enums<"payment_status"> = "unpaid";

  if (refundTotal > 0 && totalPaid <= 0) {
    paymentStatus = "refunded";
  } else if (order.total_amount > 0 && totalPaid >= order.total_amount) {
    paymentStatus = "paid";
  } else if (
    depositPaid > 0 ||
    (order.deposit_due_amount > 0 && depositPaid >= order.deposit_due_amount)
  ) {
    paymentStatus = "deposit-paid";
  }

  return {
    balanceDue,
    depositPaid,
    finalPaid,
    otherPaid,
    paymentStatus,
    refundTotal,
    totalPaid: Math.max(totalPaid, 0),
  };
}

export function getRepeatCustomerLabel(orderCount: number, inquiryCount: number) {
  if (orderCount > 1) {
    return "Repeat customer";
  }

  if (orderCount === 1 || inquiryCount > 1) {
    return "Returning lead";
  }

  return "New customer";
}

export function getRepeatCustomerValue(orderCount: number, inquiryCount: number) {
  return orderCount > 1 || inquiryCount > 1;
}

export function formatOrderMoneySummary(value: number | null) {
  if (value === null) {
    return "Not set";
  }

  return value % 1 === 0 ? formatCurrency(value) : formatCurrencyDetailed(value);
}
