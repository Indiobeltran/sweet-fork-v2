import type { Enums, Tables } from "@/types/supabase.generated";

type OrderRow = Tables<"orders">;
type PaymentRow = Tables<"payments">;

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

type ManualOrderPaymentAmountInput = {
  amountPaid: FormDataEntryValue | null;
  depositDueAmount: FormDataEntryValue | null;
  totalAmount: FormDataEntryValue | null;
};

type ManualOrderPaymentAmountResult =
  | {
      amountPaid: number;
      depositDueAmount: number;
      ok: true;
      totalAmount: number;
    }
  | {
      ok: false;
    };

function parseMoneyInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.replace(/[$,\s]/g, "");

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateManualOrderPaymentAmounts({
  amountPaid,
  depositDueAmount,
  totalAmount,
}: ManualOrderPaymentAmountInput): ManualOrderPaymentAmountResult {
  const parsedTotalAmount = parseMoneyInput(totalAmount);
  const parsedAmountPaid = parseMoneyInput(amountPaid) ?? 0;
  const parsedDepositDueAmount = parseMoneyInput(depositDueAmount) ?? 0;

  if (
    parsedTotalAmount === null ||
    parsedTotalAmount <= 0 ||
    parsedAmountPaid < 0 ||
    parsedDepositDueAmount < 0 ||
    parsedAmountPaid > parsedTotalAmount
  ) {
    return { ok: false };
  }

  return {
    amountPaid: parsedAmountPaid,
    depositDueAmount: parsedDepositDueAmount,
    ok: true,
    totalAmount: parsedTotalAmount,
  };
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
    default:
      return "Other";
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
  } else if (totalPaid > 0) {
    // Any partial payment (deposit or otherwise) counts as deposit-paid — the
    // closest available status to "partially paid".
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
