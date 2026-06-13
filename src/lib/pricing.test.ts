import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { defaultPricingBaseline, estimateInquiry, estimateItemRange, type InquiryPricingBaseline } from "./pricing.ts";
import type { InquiryPayload } from "@/types/domain";

const broadCustomCakePricing = {
  ...defaultPricingBaseline,
  "custom-cake": {
    base: [80, 5000],
    perServing: [0, 3],
  },
} satisfies InquiryPricingBaseline;

function buildInquiryPayload(
  orderItems: InquiryPayload["orderItems"],
): InquiryPayload {
  return {
    budgetFlexibility: "moderate",
    budgetRange: "150-300",
    colorPalette: "",
    customerEmail: "customer@example.com",
    customerName: "Test Customer",
    customerPhone: "801-555-0100",
    eventDate: "2026-07-15",
    eventType: "Birthday",
    fulfillmentMethod: "pickup",
    inspirationLinks: [],
    orderItems,
    preferredContact: "email",
  };
}

test("caps broad custom cake base maxima for a simple serving-based estimate", () => {
  const estimate = estimateInquiry(buildInquiryPayload([
    {
      productType: "custom-cake",
      quantity: 1,
      servings: 24,
    },
  ]), {
    pricing: broadCustomCakePricing,
  });

  assert.equal(estimate.minimum, 80);
  assert.equal(estimate.maximum, 192);
});

test("allows selected custom cake complexity to raise the capped baseline", () => {
  const estimate = estimateItemRange(
    {
      icingStyle: "painted",
      productType: "custom-cake",
      quantity: 1,
      servings: 24,
      shape: "tiered",
      tiers: 3,
      topperText: "Happy Birthday",
    },
    broadCustomCakePricing,
  );

  assert.equal(estimate.minimum, 332);
  assert.equal(estimate.maximum, 824);
});

test("keeps multi-item estimates combined without carrying an extreme fallback maximum", () => {
  const estimate = estimateInquiry(buildInquiryPayload([
    {
      productType: "custom-cake",
      quantity: 1,
      servings: 24,
    },
    {
      cupcakeCount: 24,
      productType: "cupcakes",
      quantity: 2,
    },
  ]), {
    pricing: broadCustomCakePricing,
  });

  assert.equal(estimate.minimum, 116);
  assert.equal(estimate.maximum, 276);
});
