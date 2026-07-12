import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { reconcileQuoteBackedItemCounts } from "./inquiry-order-conversion.ts";
// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { resolveInquiryOrderConversion } from "./inquiry-order-conversion.ts";

const manualValues = {
  depositDueAmount: 25,
  estimatedTotalAmount: 90,
  internalSummary: "Manual conversion summary",
  totalAmount: 100,
};

function quoteLine(id: string) {
  return {
    complexityKey: "standard",
    id,
    materialAllowance: 1,
    packagingAllowance: 0,
    pricingSource: "preset" as const,
    productKey: "custom-cake",
    quantity: 1,
    specialCosts: [],
    stageHours: {
      baking: 0,
      decorating: 0,
      deliverySetup: 0,
      packagingCleanup: 0,
      planning: 0,
      shoppingPrep: 0,
    },
    totalHours: 0,
  };
}

const finalizedQuote = {
  customerScope: "3 × custom celebration items",
  id: "quote-1",
  snapshot: {
    calculation: {
      adjustments: { contingency: 0, discount: 0, rush: 0, tax: 7.25 },
      costs: {
        contingency: 0,
        deliveryExpenses: 0,
        fixedOverhead: 0,
        internalTotal: 3,
        labor: 0,
        materials: 3,
        overheadBasis: 3,
        packaging: 0,
        specialCosts: 0,
        variableOverhead: 0,
      },
      delivery: null,
      lines: [quoteLine("item-a"), quoteLine("item-b"), quoteLine("item-c")],
      metadata: { issuedOn: "2026-07-12", validThrough: "2026-07-26", validityDays: 14 },
      pricing: {
        balanceDue: 53.63,
        customerTotal: 107.26,
        depositAmount: 53.63,
        finalPrice: 100.01,
        margin: 0.97,
        publicStartingTotal: 0,
        recommendedPrice: 105,
        suggestedPrice: 105,
        suggestedPriceUnrounded: 105,
      },
      profile: { currency: "USD" as const, profileId: "test", version: 1 },
      warnings: [],
    },
    input: { lines: [] },
    profile: { ownerHourlyRate: 35 },
  },
  version: 4,
};

describe("resolveInquiryOrderConversion", () => {
  it("uses the finalized snapshot as the authoritative order pricing source", () => {
    const result = resolveInquiryOrderConversion({
      finalizedQuote,
      inquiryItems: [
        { id: "item-b", productType: "custom-cake", quantity: 1 },
        { id: "item-a", productType: "custom-cake", quantity: 1 },
        { id: "item-c", productType: "custom-cake", quantity: 1 },
      ],
      manualValues,
    });

    assert.deepEqual(
      {
        balanceDueAmount: result.balanceDueAmount,
        depositDueAmount: result.depositDueAmount,
        estimatedTotalAmount: result.estimatedTotalAmount,
        internalSummary: result.internalSummary,
        subtotalAmount: result.subtotalAmount,
        taxAmount: result.taxAmount,
        totalAmount: result.totalAmount,
      },
      {
        balanceDueAmount: 107.26,
        depositDueAmount: 53.63,
        estimatedTotalAmount: 105,
        internalSummary: "3 × custom celebration items",
        subtotalAmount: 100.01,
        taxAmount: 7.25,
        totalAmount: 107.26,
      },
    );
    assert.deepEqual(result.quoteMetadata, {
      inquiryQuoteId: "quote-1",
      inquiryQuoteVersion: 4,
    });
  });

  it("allocates the pre-tax customer total deterministically to exact cents", () => {
    const result = resolveInquiryOrderConversion({
      finalizedQuote,
      inquiryItems: [
        { id: "item-b", productType: "custom-cake", quantity: 1 },
        { id: "item-a", productType: "custom-cake", quantity: 1 },
        { id: "item-c", productType: "custom-cake", quantity: 1 },
      ],
      manualValues,
    });

    assert.deepEqual(result.linePricing, [
      { inquiryItemId: "item-b", lineTotal: 33.34, quantity: 1, unitPrice: 33.34 },
      { inquiryItemId: "item-a", lineTotal: 33.34, quantity: 1, unitPrice: 33.34 },
      { inquiryItemId: "item-c", lineTotal: 33.33, quantity: 1, unitPrice: 33.33 },
    ]);
    assert.equal(
      result.linePricing?.reduce((sum, line) => sum + Math.round(line.lineTotal * 100), 0),
      10_001,
    );
  });

  it("rejects stale snapshots whose lines no longer match the inquiry", () => {
    assert.throws(
      () => resolveInquiryOrderConversion({
        finalizedQuote,
        inquiryItems: [{ id: "item-a", productType: "custom-cake", quantity: 1 }],
        manualValues,
      }),
      /lines must match/i,
    );
  });

  it("uses an edited whole quote quantity when creating order line pricing", () => {
    const editedQuote = structuredClone(finalizedQuote);
    editedQuote.snapshot.calculation.lines = [
      { ...quoteLine("item-a"), quantity: 2 },
    ];
    editedQuote.snapshot.calculation.pricing.finalPrice = 100;
    editedQuote.snapshot.calculation.adjustments.tax = 0;
    editedQuote.snapshot.calculation.pricing.customerTotal = 100;

    const result = resolveInquiryOrderConversion({
      finalizedQuote: editedQuote,
      inquiryItems: [{ id: "item-a", productType: "custom-cake", quantity: 1 }],
      manualValues,
    });

    assert.deepEqual(result.linePricing, [
      { inquiryItemId: "item-a", lineTotal: 100, quantity: 2, unitPrice: 50 },
    ]);
  });

  it("rejects a manual deposit greater than the manual total", () => {
    assert.throws(
      () => resolveInquiryOrderConversion({
        finalizedQuote: null,
        inquiryItems: [{ id: "item-a", productType: "custom-cake", quantity: 1 }],
        manualValues: { ...manualValues, depositDueAmount: 101, totalAmount: 100 },
      }),
      /deposit/i,
    );
  });

  it("preserves the existing manual conversion path without a finalized quote", () => {
    const result = resolveInquiryOrderConversion({
      finalizedQuote: null,
      inquiryItems: [{ id: "item-a", productType: "custom-cake", quantity: 2 }],
      manualValues,
    });

    assert.equal(result.totalAmount, 100);
    assert.equal(result.subtotalAmount, 100);
    assert.equal(result.taxAmount, 0);
    assert.equal(result.depositDueAmount, 25);
    assert.equal(result.internalSummary, "Manual conversion summary");
    assert.equal(result.linePricing, null);
    assert.equal(result.quoteMetadata, null);
  });
});

describe("reconcileQuoteBackedItemCounts", () => {
  const storedCounts = {
    cookieCount: null,
    cupcakeCount: null,
    kitCount: null,
    macaronCount: null,
  };

  it("keeps dozen and kit display counts aligned with an edited quote quantity", () => {
    assert.equal(reconcileQuoteBackedItemCounts("cupcakes", 4, storedCounts).cupcakeCount, 48);
    assert.equal(reconcileQuoteBackedItemCounts("sugar-cookies", 3, storedCounts).cookieCount, 36);
    assert.equal(reconcileQuoteBackedItemCounts("macarons", 5, storedCounts).macaronCount, 60);
    assert.equal(reconcileQuoteBackedItemCounts("diy-kit", 6, storedCounts).kitCount, 6);
  });

  it("preserves cake detail counts that are not derived from quote quantity", () => {
    const counts = { ...storedCounts, cupcakeCount: 24 };
    assert.deepEqual(reconcileQuoteBackedItemCounts("custom-cake", 2, counts), counts);
  });
});
