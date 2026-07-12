import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { defaultPricingProfile } from "./default-profile.ts";
// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import * as workflow from "./workflow.ts";

const {
  buildDefaultCustomerMessage,
  buildDefaultCustomerScope,
  buildQuoteSnapshot,
  getCurrentQuoteVersion,
  getNextQuoteVersion,
  normalizeInquiryItemsToQuoteInput,
} = workflow;

const input = {
  issuedOn: "2026-07-12",
  lines: [
    {
      complexityKey: "standard",
      id: "cake",
      productKey: "custom-cake",
      quantity: 1,
    },
    {
      complexityKey: "standard",
      id: "cupcakes",
      productKey: "cupcakes",
      quantity: 2,
    },
  ],
};

describe("quote workflow helpers", () => {
  it("builds a complete detached snapshot from validated input and server profile", () => {
    const rawInput = structuredClone(input);
    const rawProfile = structuredClone(defaultPricingProfile);
    const snapshot = buildQuoteSnapshot(rawProfile, rawInput);

    rawInput.lines[0].quantity = 99;
    rawProfile.ownerHourlyRate = 1;

    assert.equal(snapshot.input.lines[0].quantity, 1);
    assert.equal(snapshot.profile.ownerHourlyRate, 35);
    assert.equal(snapshot.calculation.profile.profileId, snapshot.profile.profileId);
    assert.equal(snapshot.calculation.profile.version, snapshot.profile.version);
    assert.equal(snapshot.calculation.pricing.customerTotal, snapshot.calculation.pricing.finalPrice);

  });

  it("generates customer-only scope and message copy without internal costs or warnings", () => {
    const snapshot = buildQuoteSnapshot(defaultPricingProfile, input);
    const scope = buildDefaultCustomerScope(snapshot.input, snapshot.profile);
    const message = buildDefaultCustomerMessage({
      calculation: snapshot.calculation,
      eventDate: "2026-08-01",
      scope,
    });

    assert.equal(scope, "1 × Custom cake; 2 × Cupcakes");
    assert.match(message, /Scope: 1 × Custom cake; 2 × Cupcakes/);
    assert.match(message, /Event date: August 1, 2026/);
    assert.match(message, /Quote total: \$1,149\.00/);
    assert.match(message, /Deposit: \$574\.50/);
    assert.match(message, /Valid through: July 26, 2026/);
    assert.match(message, /Next step:/);
    assert.doesNotMatch(message, /internal|margin|warning|labor|overhead|cost/i);
  });

  it("normalizes stored inquiry items and includes delivery only for delivery inquiries", () => {
    const items = [
      { id: "b", product_type: "cupcakes", quantity: 2, sort_order: 20 },
      { id: "a", product_type: "custom-cake", quantity: 1, sort_order: 10 },
    ];

    assert.deepEqual(
      normalizeInquiryItemsToQuoteInput(items, "pickup", "2026-07-12"),
      {
        issuedOn: "2026-07-12",
        lines: [
          { complexityKey: "standard", id: "a", productKey: "custom-cake", quantity: 1 },
          { complexityKey: "standard", id: "b", productKey: "cupcakes", quantity: 2 },
        ],
      },
    );
    assert.deepEqual(
      normalizeInquiryItemsToQuoteInput(items, "delivery", "2026-07-12").delivery,
      { roundTripMiles: 0, setupHours: 0, tollsParking: 0 },
    );
  });

  it("selects one current quote and computes the next version", () => {
    const quotes = [
      { id: "old", is_current: false, version: 2 },
      { id: "current", is_current: true, version: 4 },
    ];

    assert.equal(getCurrentQuoteVersion(quotes)?.id, "current");
    assert.equal(getNextQuoteVersion(quotes), 5);
    assert.throws(
      () => getCurrentQuoteVersion([...quotes, { id: "bad", is_current: true, version: 3 }]),
      /more than one current quote/i,
    );

  });
});
