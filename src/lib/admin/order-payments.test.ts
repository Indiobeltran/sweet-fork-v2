import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { calculateOrderPaymentSnapshot, getPaymentUiType, getStoredPaymentType, validateManualOrderPaymentAmounts } from "./order-payments.ts";

describe("calculateOrderPaymentSnapshot", () => {
  it("reports unpaid when no payments exist", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 100, total_amount: 400 },
      [],
    );

    assert.equal(snapshot.paymentStatus, "unpaid");
    assert.equal(snapshot.balanceDue, 400);
    assert.equal(snapshot.totalPaid, 0);
  });

  it("ignores pending and failed payments", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 100, total_amount: 400 },
      [
        { amount: 100, payment_type: "deposit", status: "pending" },
        { amount: 300, payment_type: "balance", status: "failed" },
      ],
    );

    assert.equal(snapshot.paymentStatus, "unpaid");
    assert.equal(snapshot.balanceDue, 400);
  });

  it("marks deposit-paid after a paid deposit", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 100, total_amount: 400 },
      [{ amount: 100, payment_type: "deposit", status: "paid" }],
    );

    assert.equal(snapshot.paymentStatus, "deposit-paid");
    assert.equal(snapshot.depositPaid, 100);
    assert.equal(snapshot.balanceDue, 300);
  });

  it("marks deposit-paid after a partial non-deposit payment", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 0, total_amount: 400 },
      [{ amount: 200, payment_type: "balance", status: "paid" }],
    );

    assert.equal(snapshot.paymentStatus, "deposit-paid");
    assert.equal(snapshot.finalPaid, 200);
    assert.equal(snapshot.balanceDue, 200);
  });

  it("marks paid once the total is covered", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 100, total_amount: 400 },
      [
        { amount: 100, payment_type: "deposit", status: "paid" },
        { amount: 300, payment_type: "balance", status: "paid" },
      ],
    );

    assert.equal(snapshot.paymentStatus, "paid");
    assert.equal(snapshot.balanceDue, 0);
    assert.equal(snapshot.totalPaid, 400);
  });

  it("clamps balance due at zero on overpayment", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 0, total_amount: 400 },
      [{ amount: 450, payment_type: "full", status: "paid" }],
    );

    assert.equal(snapshot.paymentStatus, "paid");
    assert.equal(snapshot.balanceDue, 0);
    assert.equal(snapshot.totalPaid, 450);
  });

  it("marks refunded when refunds cancel all payments", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 100, total_amount: 400 },
      [
        { amount: 100, payment_type: "deposit", status: "paid" },
        { amount: 100, payment_type: "refund", status: "paid" },
      ],
    );

    assert.equal(snapshot.paymentStatus, "refunded");
    assert.equal(snapshot.refundTotal, 100);
    assert.equal(snapshot.totalPaid, 0);
  });

  it("counts refunded-status rows as refunds and keeps net partial paid state", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 100, total_amount: 400 },
      [
        { amount: 300, payment_type: "balance", status: "paid" },
        { amount: 100, payment_type: "adjustment", status: "refunded" },
      ],
    );

    assert.equal(snapshot.paymentStatus, "deposit-paid");
    assert.equal(snapshot.refundTotal, 100);
    assert.equal(snapshot.totalPaid, 200);
    assert.equal(snapshot.balanceDue, 200);
  });

  it("counts adjustment payments toward the total", () => {
    const snapshot = calculateOrderPaymentSnapshot(
      { deposit_due_amount: 0, total_amount: 400 },
      [{ amount: 400, payment_type: "adjustment", status: "paid" }],
    );

    assert.equal(snapshot.paymentStatus, "paid");
    assert.equal(snapshot.otherPaid, 400);
  });
});

describe("payment type mapping", () => {
  it("round-trips UI types through stored types", () => {
    assert.equal(getPaymentUiType(getStoredPaymentType("deposit")!), "deposit");
    assert.equal(getPaymentUiType(getStoredPaymentType("final")!), "final");
    assert.equal(getPaymentUiType(getStoredPaymentType("other")!), "other");
  });

  it("rejects unknown stored payment types", () => {
    assert.equal(getStoredPaymentType("bogus"), null);
    assert.equal(getStoredPaymentType(""), null);
  });

  it("maps full and balance payments to the final UI type", () => {
    assert.equal(getPaymentUiType("full"), "final");
    assert.equal(getPaymentUiType("balance"), "final");
    assert.equal(getPaymentUiType("refund"), "other");
  });
});

describe("validateManualOrderPaymentAmounts", () => {
  it("rejects a negative manual-order total", () => {
    assert.equal(
      validateManualOrderPaymentAmounts({
        amountPaid: "0",
        depositDueAmount: "0",
        totalAmount: "-10",
      }).ok,
      false,
    );
  });

  it("rejects a zero manual-order total", () => {
    assert.equal(
      validateManualOrderPaymentAmounts({
        amountPaid: "0",
        depositDueAmount: "0",
        totalAmount: "0",
      }).ok,
      false,
    );
  });

  it("rejects a negative amount paid", () => {
    assert.equal(
      validateManualOrderPaymentAmounts({
        amountPaid: "-1",
        depositDueAmount: "0",
        totalAmount: "120",
      }).ok,
      false,
    );
  });

  it("accepts a partial payment below the order total", () => {
    const result = validateManualOrderPaymentAmounts({
      amountPaid: "40",
      depositDueAmount: "0",
      totalAmount: "120",
    });

    assert.equal(result.ok, true);
    assert.equal(result.amountPaid, 40);
    assert.equal(result.totalAmount, 120);
  });
});
