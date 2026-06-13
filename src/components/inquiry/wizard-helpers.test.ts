import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { findStepForErrors, flattenIssues, formatSelectedItemSummary, getFieldErrorClass, getSafeSubmissionErrorMessage, getStepErrorMessage, isErrorForStep } from "./wizard-helpers.ts";
import type { InquiryProductItem } from "@/types/domain";

describe("formatSelectedItemSummary", () => {
  const cases: Array<[InquiryProductItem, string]> = [
    [{ productType: "custom-cake", quantity: 1, servings: 24 }, "24 servings"],
    [
      { productType: "wedding-cake", quantity: 1, weddingServings: 80 },
      "80 servings",
    ],
    [
      { productType: "wedding-cake", quantity: 1, servings: 60 },
      "60 servings",
    ],
    [{ productType: "cupcakes", quantity: 1, cupcakeCount: 36 }, "36 cupcakes"],
    [
      { productType: "sugar-cookies", quantity: 1, cookieCount: 24 },
      "24 cookies",
    ],
    [{ productType: "macarons", quantity: 1, macaronCount: 48 }, "48 macarons"],
    [{ productType: "diy-kit", quantity: 1, kitCount: 3 }, "3 kits"],
  ];

  for (const [item, expected] of cases) {
    it(`summarizes ${item.productType}`, () => {
      assert.equal(formatSelectedItemSummary(item), expected);
    });
  }

  it("shows a placeholder when a required count is missing", () => {
    assert.equal(
      formatSelectedItemSummary({ productType: "cupcakes", quantity: 1 }),
      "? cupcakes",
    );
  });
});

describe("isErrorForStep", () => {
  it("routes event, fulfillment, and budget keys to step 0", () => {
    assert.equal(isErrorForStep("eventDate", 0), true);
    assert.equal(isErrorForStep("guestCount", 0), true);
    assert.equal(isErrorForStep("fulfillmentMethod", 0), true);
    assert.equal(isErrorForStep("deliveryZip", 0), true);
    assert.equal(isErrorForStep("budgetRange", 0), true);
    assert.equal(isErrorForStep("customerName", 0), false);
  });

  it("separates the selection step from the item-details step", () => {
    assert.equal(isErrorForStep("orderItems", 1), true);
    assert.equal(isErrorForStep("orderItems.0.servings", 1), false);
    assert.equal(isErrorForStep("orderItems.0.servings", 2), true);
    assert.equal(isErrorForStep("orderItems", 2), false);
  });

  it("routes inspiration and upload keys to step 3", () => {
    assert.equal(isErrorForStep("colorPalette", 3), true);
    assert.equal(isErrorForStep("inspirationLinks", 3), true);
    assert.equal(isErrorForStep("inspirationUploads", 3), true);
  });

  it("routes contact keys to the final step", () => {
    assert.equal(isErrorForStep("customerEmail", 4), true);
    assert.equal(isErrorForStep("preferredContact", 4), true);
    assert.equal(isErrorForStep("additionalNotes", 4), true);
  });
});

describe("findStepForErrors", () => {
  it("returns the earliest step that has an error", () => {
    assert.equal(findStepForErrors({ eventDate: "Required" }), 0);
    assert.equal(findStepForErrors({ orderItems: "Pick one" }), 1);
    assert.equal(findStepForErrors({ "orderItems.1.cookieCount": "Required" }), 2);
    assert.equal(findStepForErrors({ inspirationLinks: "Bad link" }), 3);
    assert.equal(findStepForErrors({ customerPhone: "Required" }), 4);
  });

  it("prefers an earlier step when multiple steps have errors", () => {
    assert.equal(
      findStepForErrors({ eventDate: "Required", customerPhone: "Required" }),
      0,
    );
  });
});

describe("getStepErrorMessage", () => {
  it("returns a distinct message per step", () => {
    const messages = [0, 1, 2, 3, 4].map(getStepErrorMessage);
    assert.equal(new Set(messages).size, messages.length);
    assert.match(getStepErrorMessage(1), /at least one dessert/i);
  });
});

describe("getSafeSubmissionErrorMessage", () => {
  it("passes through expected customer-facing messages", () => {
    const message = "Please take a moment to review the inquiry before submitting.";
    assert.equal(getSafeSubmissionErrorMessage(new Error(message)), message);
  });

  it("hides unexpected internal errors behind a safe fallback", () => {
    const fallback =
      "We could not submit the inquiry right now. Please try again in a few minutes.";
    assert.equal(
      getSafeSubmissionErrorMessage(new Error("estimated_max 5072 column violation")),
      fallback,
    );
    assert.equal(getSafeSubmissionErrorMessage("not an error"), fallback);
    assert.equal(getSafeSubmissionErrorMessage(new Error("")), fallback);
  });
});

describe("flattenIssues", () => {
  it("keeps the first message per path", () => {
    const errors = flattenIssues([
      { path: ["orderItems", 0, "servings"], message: "First" },
      { path: ["orderItems", 0, "servings"], message: "Second" },
      { path: ["eventDate"], message: "Choose a date" },
    ]);

    assert.equal(errors["orderItems.0.servings"], "First");
    assert.equal(errors.eventDate, "Choose a date");
  });
});

describe("getFieldErrorClass", () => {
  it("returns an error class only when a message is present", () => {
    assert.equal(getFieldErrorClass(undefined, undefined), undefined);
    assert.match(getFieldErrorClass("Required") ?? "", /border-rose-300/);
  });
});
