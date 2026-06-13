import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getOrderNextAction, getOrderStatusLabel, getPaymentStatusLabel } from "./order-status.ts";

describe("order workflow owner-friendly labels", () => {
  it("renders order statuses without raw enum casing", () => {
    assert.equal(getOrderStatusLabel("in-production"), "In production");
    assert.equal(getOrderStatusLabel("draft"), "Draft");
    assert.equal(getOrderStatusLabel("completed"), "Completed");
  });

  it("renders payment statuses with business-friendly labels", () => {
    assert.equal(getPaymentStatusLabel("unpaid"), "Unpaid");
    assert.equal(getPaymentStatusLabel("deposit-paid"), "Deposit paid");
    assert.equal(getPaymentStatusLabel("paid"), "Paid in full");
    assert.equal(getPaymentStatusLabel("refunded"), "Refunded");
  });
});

describe("getOrderNextAction", () => {
  const base = {
    balanceDueAmount: 0,
    depositPaid: 0,
    fulfillmentWindow: null,
    paymentStatus: "unpaid" as const,
    status: "confirmed" as const,
  };

  it("flags drafts and quotes before any payment work", () => {
    assert.deepEqual(getOrderNextAction({ ...base, status: "draft" }), {
      label: "Review order details",
      tone: "attention",
    });
    assert.deepEqual(getOrderNextAction({ ...base, status: "quoted" }), {
      label: "Send or confirm invoice",
      tone: "attention",
    });
  });

  it("asks to collect the deposit when nothing is paid", () => {
    assert.deepEqual(
      getOrderNextAction({ ...base, status: "confirmed", balanceDueAmount: 400 }),
      { label: "Collect deposit", tone: "attention" },
    );
  });

  it("shows order in progress once the deposit is in and a balance remains", () => {
    assert.deepEqual(
      getOrderNextAction({
        ...base,
        status: "in-production",
        paymentStatus: "deposit-paid",
        depositPaid: 200,
        balanceDueAmount: 200,
      }),
      { label: "Order in progress", tone: "neutral" },
    );
  });

  it("asks to confirm fulfillment when paid but no window is set", () => {
    assert.deepEqual(
      getOrderNextAction({
        ...base,
        status: "confirmed",
        paymentStatus: "paid",
        depositPaid: 200,
        balanceDueAmount: 0,
        fulfillmentWindow: null,
      }),
      { label: "Confirm pickup/delivery details", tone: "attention" },
    );
  });

  it("marks ready for fulfillment when paid and a window is set", () => {
    assert.deepEqual(
      getOrderNextAction({
        ...base,
        status: "confirmed",
        paymentStatus: "paid",
        depositPaid: 400,
        balanceDueAmount: 0,
        fulfillmentWindow: "Saturday 10am pickup",
      }),
      { label: "Ready for fulfillment", tone: "positive" },
    );
  });

  it("collects the final payment when fulfilled with a balance", () => {
    assert.deepEqual(
      getOrderNextAction({
        ...base,
        status: "fulfilled",
        paymentStatus: "deposit-paid",
        depositPaid: 200,
        balanceDueAmount: 200,
      }),
      { label: "Collect final payment", tone: "attention" },
    );
  });

  it("treats cancelled and completed orders conservatively", () => {
    assert.deepEqual(getOrderNextAction({ ...base, status: "cancelled" }), {
      label: "Order cancelled",
      tone: "neutral",
    });
    assert.deepEqual(getOrderNextAction({ ...base, status: "completed" }), {
      label: "Order completed",
      tone: "positive",
    });
  });
});
