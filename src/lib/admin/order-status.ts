import type { Enums } from "@/types/supabase.generated";

export function getOrderStatusLabel(status: Enums<"order_status">) {
  switch (status) {
    case "draft":
      return "Draft";
    case "quoted":
      return "Quoted";
    case "confirmed":
      return "Confirmed";
    case "in-production":
      return "In production";
    case "fulfilled":
      return "Fulfilled";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function getPaymentStatusLabel(status: Enums<"payment_status">) {
  switch (status) {
    case "unpaid":
      return "Unpaid";
    case "deposit-paid":
      return "Deposit paid";
    case "paid":
      return "Paid in full";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

export type OrderNextActionTone = "attention" | "neutral" | "positive";

export type OrderNextAction = {
  label: string;
  tone: OrderNextActionTone;
};

export type OrderNextActionInput = {
  balanceDueAmount: number;
  depositPaid: number;
  fulfillmentWindow: string | null;
  paymentStatus: Enums<"payment_status">;
  status: Enums<"order_status">;
};

/**
 * Derive a compact, owner-friendly "next action" label from existing order
 * data only. Deposit vs. final precision comes from the payment snapshot
 * (`paymentStatus`, `depositPaid`, `balanceDueAmount`); no schema fields are
 * inferred. Labels stay conservative when the data is ambiguous.
 */
export function getOrderNextAction(input: OrderNextActionInput): OrderNextAction {
  const { balanceDueAmount, depositPaid, fulfillmentWindow, paymentStatus, status } = input;
  const hasBalance = balanceDueAmount > 0;
  const fulfillmentReady = Boolean(fulfillmentWindow && fulfillmentWindow.trim().length > 0);

  if (status === "cancelled") {
    return { label: "Order cancelled", tone: "neutral" };
  }

  if (status === "completed") {
    return { label: "Order completed", tone: "positive" };
  }

  if (status === "draft") {
    return { label: "Review order details", tone: "attention" };
  }

  if (status === "quoted") {
    return { label: "Send or confirm invoice", tone: "attention" };
  }

  if (status === "fulfilled") {
    return hasBalance
      ? { label: "Collect final payment", tone: "attention" }
      : { label: "Fulfilled", tone: "positive" };
  }

  // Confirmed or in production from here.
  if (paymentStatus === "unpaid" && depositPaid <= 0) {
    return { label: "Collect deposit", tone: "attention" };
  }

  if (hasBalance) {
    return { label: "Order in progress", tone: "neutral" };
  }

  // Paid in full and still ahead of fulfillment.
  if (!fulfillmentReady) {
    return { label: "Confirm pickup/delivery details", tone: "attention" };
  }

  return { label: "Ready for fulfillment", tone: "positive" };
}

export function getOrderNextActionClasses(tone: OrderNextActionTone) {
  switch (tone) {
    case "attention":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "positive":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "neutral":
    default:
      return "border-gold/25 bg-gold/12 text-charcoal";
  }
}
