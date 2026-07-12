import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { defaultPricingProfile } from "./default-profile.ts";
// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import * as validation from "./validation.ts";

const {
  parseCustomerMessage,
  parseCustomerScope,
  parsePricingProfile,
  parseQuoteInput,
} = validation;

const validInput = {
  issuedOn: "2026-07-12",
  lines: [
    {
      complexityKey: "standard",
      id: "line-1",
      productKey: "custom-cake",
      quantity: 1,
      specialCosts: [
        { id: "flowers", label: "Fresh flowers", quantity: 2, unitCost: 8 },
      ],
    },
  ],
  validityDays: 14,
};

describe("quote JSON validation", () => {
  it("parses complete quote input and pricing profile values", () => {
    assert.deepEqual(parseQuoteInput(validInput), validInput);
    assert.deepEqual(parsePricingProfile(defaultPricingProfile), defaultPricingProfile);
  });

  it("rejects empty lines, blank identifiers and labels, and unsupported adjustment kinds", () => {
    assert.throws(() => parseQuoteInput({ lines: [] }), /lines/i);
    assert.throws(
      () => parseQuoteInput({
        lines: [{ complexityKey: "standard", id: " ", productKey: "custom-cake" }],
      }),
      /id/i,
    );
    assert.throws(
      () => parseQuoteInput({
        lines: [{
          complexityKey: "standard",
          id: "line-1",
          productKey: "custom-cake",
          specialCosts: [{ id: "flowers", label: " ", unitCost: 2 }],
        }],
      }),
      /label/i,
    );
    assert.throws(
      () => parseQuoteInput({ ...validInput, rush: { kind: "multiplier", value: 1 } }),
      /kind/i,
    );
  });

  it("rejects non-finite or negative amounts and hours plus non-positive quantities", () => {
    assert.throws(
      () => parseQuoteInput({
        ...validInput,
        lines: [{ ...validInput.lines[0], quantity: 0 }],
      }),
      /quantity/i,
    );
    assert.throws(
      () => parseQuoteInput({
        ...validInput,
        lines: [{ ...validInput.lines[0], quantity: 1.5 }],
      }),
      /quantity/i,
    );
    assert.throws(
      () => parseQuoteInput({
        ...validInput,
        lines: [{
          ...validInput.lines[0],
          pricing: { materialAllowance: Number.NaN, source: "manual" },
        }],
      }),
      /materialAllowance/i,
    );
    assert.throws(
      () => parsePricingProfile({ ...defaultPricingProfile, ownerHourlyRate: -1 }),
      /ownerHourlyRate/i,
    );
    assert.throws(
      () => parsePricingProfile({
        ...defaultPricingProfile,
        productPresets: {
          ...defaultPricingProfile.productPresets,
          "custom-cake": {
            ...defaultPricingProfile.productPresets["custom-cake"],
            complexities: {
              standard: {
                ...defaultPricingProfile.productPresets["custom-cake"].complexities.standard,
                stageHours: {
                  ...defaultPricingProfile.productPresets["custom-cake"].complexities.standard.stageHours,
                  baking: Number.POSITIVE_INFINITY,
                },
              },
            },
          },
        },
      }),
      /baking/i,
    );
  });

  it("enforces bounded rates, nonnegative validity, and positive profile versions", () => {
    assert.equal(parseQuoteInput({ ...validInput, validityDays: 0 }).validityDays, 0);
    assert.throws(
      () => parsePricingProfile({ ...defaultPricingProfile, version: 0 }),
      /version/i,
    );

    assert.throws(
      () => parseQuoteInput({ ...validInput, depositRate: 1.01 }),
      /depositRate/i,
    );
    assert.throws(
      () => parsePricingProfile({ ...defaultPricingProfile, targetMargin: 1 }),
      /targetMargin/i,
    );
    assert.throws(
      () => parsePricingProfile({ ...defaultPricingProfile, defaultTaxRate: -0.01 }),
      /defaultTaxRate/i,
    );
    assert.throws(
      () => parsePricingProfile({ ...defaultPricingProfile, minimumMargin: 1 }),
      /minimumMargin/i,
    );
    assert.throws(
      () => parsePricingProfile({
        ...defaultPricingProfile,
        minimumMargin: 0.4,
        targetMargin: 0.3,
      }),
      /minimumMargin/i,
    );
  });

  it("rejects invalid calendar dates and unknown object properties", () => {
    assert.throws(
      () => parseQuoteInput({ ...validInput, issuedOn: "2026-02-30" }),
      /issuedOn/i,
    );
    assert.throws(
      () => parseQuoteInput({ ...validInput, clientTotal: 1 }),
      /unrecognized key/i,
    );
    assert.throws(
      () => parsePricingProfile({ ...defaultPricingProfile, internalNote: "trust me" }),
      /unrecognized key/i,
    );
  });

  it("validates supplied customer copy as bounded, nonempty plain text", () => {
    assert.equal(parseCustomerScope("  One custom cake  "), "One custom cake");
    assert.equal(parseCustomerMessage("  Please reply to approve.  "), "Please reply to approve.");
    assert.throws(() => parseCustomerScope("   "), /scope/i);
    assert.throws(() => parseCustomerScope("Internal labor and overhead"), /scope/i);
    assert.throws(() => parseCustomerScope("Materials: $100; owner rate: $35/hr"), /scope/i);
    assert.throws(() => parseCustomerMessage("x".repeat(5001)), /message/i);
    assert.throws(
      () => parsePricingProfile({
        ...defaultPricingProfile,
        productPresets: {
          ...defaultPricingProfile.productPresets,
          "custom-cake": {
            ...defaultPricingProfile.productPresets["custom-cake"],
            label: "Custom cake — materials $40",
          },
        },
      }),
      /label/i,
    );
  });

  it("bounds untrusted identifiers and collection sizes", () => {
    assert.throws(
      () => parseQuoteInput({
        ...validInput,
        lines: [{ ...validInput.lines[0], id: "x".repeat(101) }],
      }),
      /id/i,
    );
    assert.throws(
      () => parseQuoteInput({
        ...validInput,
        lines: Array.from({ length: 51 }, (_, index) => ({
          complexityKey: "standard",
          id: `line-${index}`,
          productKey: "custom-cake",
        })),
      }),
      /lines/i,
    );
  });
});
