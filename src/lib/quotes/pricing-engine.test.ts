import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { calculateQuote } from "./pricing-engine.ts";
// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { defaultPricingProfile } from "./default-profile.ts";
import type { PricingProfile, QuoteInput } from "./types.ts";

const pricingProfile = {
  currency: "USD",
  defaultDepositRate: 0.5,
  defaultQuoteValidityDays: 14,
  defaultTaxRate: 0,
  delivery: {
    mileageRate: 0.7,
    minimumCharge: 15,
  },
  fixedOverheadPerOrder: 20,
  minimumMargin: 0.2,
  ownerHourlyRate: 30,
  productPresets: {
    "custom-cake": {
      complexities: {
        standard: {
          materialAllowance: 40,
          packagingAllowance: 10,
          stageHours: {
            baking: 2,
            decorating: 3,
            deliverySetup: 0,
            packagingCleanup: 1,
            planning: 1,
            shoppingPrep: 1,
          },
        },
      },
      label: "Custom cake",
      publicStartingPrice: 80,
    },
  },
  profileId: "owner-pricing",
  targetMargin: 0.25,
  variableOverheadRate: 0.1,
  version: 3,
} satisfies PricingProfile;

function buildQuoteInput(overrides: Partial<QuoteInput> = {}): QuoteInput {
  return {
    issuedOn: "2026-07-12",
    lines: [
      {
        complexityKey: "standard",
        id: "cake-1",
        productKey: "custom-cake",
        quantity: 1,
        specialCosts: [
          {
            id: "board",
            label: "Specialty board",
            quantity: 1,
            unitCost: 5,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("calculateQuote", () => {
  it("calculates stage labor, direct materials, overhead, and target-margin price", () => {
    const quote = calculateQuote(pricingProfile, buildQuoteInput());

    assert.equal(quote.profile.profileId, "owner-pricing");
    assert.equal(quote.profile.version, 3);
    assert.equal(quote.lines[0].totalHours, 8);
    assert.equal(quote.costs.labor, 240);
    assert.equal(quote.costs.materials, 40);
    assert.equal(quote.costs.packaging, 10);
    assert.equal(quote.costs.specialCosts, 5);
    assert.equal(quote.costs.overheadBasis, 295);
    assert.equal(quote.costs.variableOverhead, 29.5);
    assert.equal(quote.costs.fixedOverhead, 20);
    assert.equal(quote.costs.internalTotal, 344.5);
    assert.equal(quote.pricing.suggestedPriceUnrounded, 459.33);
    assert.equal(quote.pricing.suggestedPrice, 459);
    assert.equal(quote.pricing.finalPrice, 459);
    assert.equal(quote.pricing.customerTotal, 459);
    assert.equal(quote.pricing.depositAmount, 229.5);
    assert.equal(quote.pricing.balanceDue, 229.5);
    assert.deepEqual(quote.warnings, []);
  });

  it("calculates round-trip mileage, delivery labor, tolls, and a minimum charge", () => {
    const quote = calculateQuote(pricingProfile, buildQuoteInput({
      delivery: {
        roundTripMiles: 20,
        setupHours: 1.5,
        tollsParking: 3,
      },
    }));

    assert.deepEqual(quote.delivery, {
      appliedCost: 62,
      laborCost: 45,
      mileageCost: 14,
      minimumAdjustment: 0,
      roundTripMiles: 20,
      setupHours: 1.5,
      tollsParking: 3,
    });
    assert.equal(quote.costs.labor, 285);
    assert.equal(quote.costs.deliveryExpenses, 17);
    assert.equal(quote.costs.overheadBasis, 340);
    assert.equal(quote.costs.internalTotal, 411);

    const minimumQuote = calculateQuote(pricingProfile, buildQuoteInput({
      delivery: {
        roundTripMiles: 0,
        setupHours: 0,
        tollsParking: 0,
      },
    }));

    assert.equal(minimumQuote.delivery?.appliedCost, 15);
    assert.equal(minimumQuote.delivery?.minimumAdjustment, 15);
    assert.equal(minimumQuote.costs.internalTotal, 359.5);
  });

  it("applies contingency, rush, discount, editable price, tax, and deposit in a stable order", () => {
    const quote = calculateQuote(pricingProfile, buildQuoteInput({
      contingency: { kind: "fixed", value: 20 },
      depositRate: 0.4,
      discount: { kind: "fixed", value: 10 },
      finalPrice: 500,
      rush: { kind: "percentage", value: 0.1 },
      taxRate: 0.0725,
    }));

    assert.equal(quote.costs.contingency, 20);
    assert.equal(quote.costs.internalTotal, 364.5);
    assert.deepEqual(quote.adjustments, {
      contingency: 20,
      discount: 10,
      rush: 48.6,
      tax: 36.25,
    });
    assert.equal(quote.pricing.suggestedPrice, 486);
    assert.equal(quote.pricing.recommendedPrice, 525);
    assert.equal(quote.pricing.finalPrice, 500);
    assert.equal(quote.pricing.customerTotal, 536.25);
    assert.equal(quote.pricing.depositAmount, 214.5);
    assert.equal(quote.pricing.balanceDue, 321.75);
    assert.equal(quote.pricing.margin, 0.271);
  });

  it("warns when an editable final price is below cost, minimum margin, or public starting prices", () => {
    const quote = calculateQuote(pricingProfile, buildQuoteInput({ finalPrice: 50 }));

    assert.equal(quote.pricing.publicStartingTotal, 80);
    assert.deepEqual(
      quote.warnings.map((warning) => warning.code),
      ["BELOW_COST", "BELOW_MINIMUM_MARGIN", "BELOW_PUBLIC_STARTING_PRICE"],
    );
  });

  it("normalizes a manual fallback when a product or complexity preset is missing", () => {
    const quote = calculateQuote(pricingProfile, buildQuoteInput({
      lines: [
        {
          complexityKey: "bespoke",
          id: "manual-1",
          pricing: {
            materialAllowance: 70,
            packagingAllowance: 15,
            source: "manual",
            stageHours: {
              baking: 2,
              decorating: 5,
              planning: 1,
            },
          },
          productKey: "sculpted-cake",
          quantity: 1,
        },
      ],
    }));

    assert.deepEqual(quote.lines[0].stageHours, {
      planning: 1,
      shoppingPrep: 0,
      baking: 2,
      decorating: 5,
      packagingCleanup: 0,
      deliverySetup: 0,
    });
    assert.equal(quote.lines[0].pricingSource, "manual");
    assert.deepEqual(
      quote.warnings.map((warning) => warning.code),
      ["MISSING_PRESET", "MANUAL_FALLBACK"],
    );
  });

  it("returns immutable quote-validity and profile-version metadata deterministically", () => {
    const input = buildQuoteInput();
    const first = calculateQuote(pricingProfile, input);
    const second = calculateQuote(pricingProfile, input);

    assert.deepEqual(first, second);
    assert.deepEqual(first.metadata, {
      issuedOn: "2026-07-12",
      validThrough: "2026-07-26",
      validityDays: 14,
    });
  });

  it("rejects malformed numeric values and impossible margins", () => {
    assert.throws(
      () => calculateQuote({ ...pricingProfile, targetMargin: 1 }, buildQuoteInput()),
      /profile\.targetMargin must be less than 1/,
    );
    assert.throws(
      () => calculateQuote(pricingProfile, buildQuoteInput({
        lines: [{
          complexityKey: "standard",
          id: "bad-quantity",
          productKey: "custom-cake",
          quantity: -1,
        }],
      })),
      /input\.lines\[0\]\.quantity must be greater than 0/,
    );
    assert.throws(
      () => calculateQuote(pricingProfile, buildQuoteInput({
        lines: [{
          complexityKey: "standard",
          id: "bad-cost",
          productKey: "custom-cake",
          specialCosts: [{ id: "bad", label: "Bad", unitCost: Number.NaN }],
        }],
      })),
      /input\.lines\[0\]\.specialCosts\[0\]\.unitCost must be finite/,
    );
    assert.throws(
      () => calculateQuote({ ...pricingProfile, version: 0 }, buildQuoteInput()),
      /profile\.version must be a positive integer/,
    );
    assert.throws(
      () => calculateQuote({
        ...pricingProfile,
        delivery: { mileageRate: -0.5, minimumCharge: 15 },
      }, buildQuoteInput()),
      /profile\.delivery\.mileageRate must be zero or greater/,
    );
    assert.throws(
      () => calculateQuote({
        ...pricingProfile,
        productPresets: {
          "custom-cake": {
            ...pricingProfile.productPresets["custom-cake"],
            publicStartingPrice: Number.NaN,
          },
        },
      }, buildQuoteInput()),
      /publicStartingPrice must be finite/,
    );
    assert.throws(
      () => calculateQuote(pricingProfile, buildQuoteInput({ issuedOn: "2026-02-30" })),
      /input\.issuedOn must be a valid date/,
    );
    assert.throws(
      () => calculateQuote(pricingProfile, buildQuoteInput({
        discount: { kind: "percentage", value: 1.01 },
      })),
      /adjustment\.value must be 1 or less/,
    );
    assert.throws(
      () => calculateQuote(pricingProfile, buildQuoteInput({ validityDays: 1.5 })),
      /input\.validityDays must be a nonnegative integer/,
    );
  });
});

describe("defaultPricingProfile", () => {
  it("seeds editable presets with the current public starting prices", () => {
    assert.equal(defaultPricingProfile.version, 1);
    assert.equal(defaultPricingProfile.delivery.mileageRate, 0.725);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(defaultPricingProfile.productPresets).map(([key, preset]) => [
          key,
          preset.publicStartingPrice,
        ]),
      ),
      {
        "custom-cake": 80,
        "wedding-cake": 300,
        cupcakes: 36,
        "sugar-cookies": 48,
        macarons: 30,
        "diy-kit": 25,
      },
    );
  });
});
