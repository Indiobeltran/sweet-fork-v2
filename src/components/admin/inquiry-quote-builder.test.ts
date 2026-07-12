import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const componentSource = readFileSync(
  join(root, "src/components/admin/inquiry-quote-builder.tsx"),
  "utf8",
);
const pageSource = readFileSync(
  join(root, "src/app/admin/(protected)/inquiries/[id]/quote/page.tsx"),
  "utf8",
);
const inquiryDetailSource = readFileSync(
  join(root, "src/app/admin/(protected)/inquiries/[id]/page.tsx"),
  "utf8",
);
const actionsSource = readFileSync(
  join(root, "src/app/admin/(protected)/inquiries/[id]/quote/actions.ts"),
  "utf8",
);

describe("inquiry quote builder source contract", () => {
  it("loads the server quote context and routes missing inquiries to not found", () => {
    assert.match(pageSource, /getQuoteBuilderData\(id\)/);
    assert.match(pageSource, /if \(!data\)[\s\S]*notFound\(\)/);
    assert.match(pageSource, /<InquiryQuoteBuilder/);
  });

  it("supports an editable draft, clean-draft finalization, locked summaries, revisions, and history", () => {
    assert.match(componentSource, /calculateQuote\(/);
    assert.match(componentSource, /saveQuoteDraft/);
    assert.match(componentSource, /finalizeQuoteDraft/);
    assert.match(componentSource, /createQuoteRevision/);
    assert.match(componentSource, /hasUnsavedChanges/);
    assert.match(componentSource, /disabled=\{hasUnsavedChanges/);
    assert.match(componentSource, /Quote history/);
    assert.match(componentSource, /Copy customer message/);
    assert.match(componentSource, /navigator\.clipboard\.writeText/);
  });

  it("offers every required line, delivery, adjustment, and outcome control", () => {
    for (const label of [
      "Complexity",
      "Quantity",
      "Planning hours",
      "Shopping / prep hours",
      "Baking hours",
      "Decorating hours",
      "Packaging / cleanup hours",
      "Material allowance",
      "Packaging allowance",
      "Special add-on label",
      "Special add-on cost",
      "Round-trip mileage",
      "Delivery setup hours",
      "Tolls / parking",
      "Rush fee",
      "Contingency",
      "Discount",
      "Tax",
      "Deposit",
      "Validity days",
      "Final pre-tax price",
    ]) {
      assert.match(componentSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }

    for (const copy of [
      "Internal cost",
      "Suggested price",
      "Recommended price",
      "Customer total",
      "Deposit due",
      "Balance due",
      "Margin",
      "Effective labor recovery",
    ]) {
      assert.match(componentSource, new RegExp(copy));
    }
  });

  it("keeps delivery inputs conditional and manual line edits explicit", () => {
    assert.match(componentSource, /fulfillmentMethod === "delivery"/);
    assert.match(componentSource, /source: "manual"/);
    assert.match(componentSource, /source: "preset"/);
    assert.match(componentSource, /Use preset/);
  });

  it("keeps pricing calibration owner-only, collapsible, and complete", () => {
    assert.match(componentSource, /isOwner/);
    assert.match(componentSource, /<details/);
    assert.match(componentSource, /Starter assumptions need owner approval/);
    assert.match(componentSource, /savePricingProfile/);
    assert.match(componentSource, /ownerHourlyRate/);
    assert.match(componentSource, /fixedOverheadPerOrder/);
    assert.match(componentSource, /variableOverheadRate/);
    assert.match(componentSource, /targetMargin/);
    assert.match(componentSource, /minimumMargin/);
    assert.match(componentSource, /mileageRate/);
    assert.match(componentSource, /minimumCharge/);
    assert.match(componentSource, /defaultTaxRate/);
    assert.match(componentSource, /defaultDepositRate/);
    assert.match(componentSource, /defaultQuoteValidityDays/);
    assert.match(componentSource, /productPresets/);
    assert.match(componentSource, /Public starting price/);
    assert.match(componentSource, /onPublicStartingPriceChange/);
  });

  it("prevents preview-to-save drift and exposes detailed outcomes", () => {
    assert.match(componentSource, /isProfileDirty/);
    assert.match(componentSource, /profileDiffersFromSavedDraft/);
    assert.match(componentSource, /disabled=\{!calculation \|\| isProfileDirty\}/);
    assert.match(componentSource, /Save pricing calibration first/);
    for (const copy of [
      "Line hours",
      "Rush adjustment",
      "Discount applied",
      "Tax applied",
      "Valid through",
      "Mileage expense",
      "Delivery labor",
      "Delivery expenses / minimum",
    ]) {
      assert.match(componentSource, new RegExp(copy));
    }
  });

  it("reports clipboard failures accessibly", () => {
    assert.match(componentSource, /catch/);
    assert.match(componentSource, /Could not copy automatically/);
  });

  it("lets number fields be cleared while editing and announces recalculated totals", () => {
    assert.match(componentSource, /event\.target\.value === ""/);
    assert.match(componentSource, /onBlur/);
    assert.match(componentSource, /Quote preview updated/);
    assert.match(componentSource, /aria-atomic="true"/);
  });

  it("adds a prominent quote CTA and makes finalized pricing the conversion handoff", () => {
    assert.match(inquiryDetailSource, /Build quote|Open quote/);
    assert.match(inquiryDetailSource, /finalized quote/i);
    assert.match(inquiryDetailSource, /finalizedQuoteIssue/);
    assert.match(inquiryDetailSource, /\/admin\/inquiries\/\$\{detail\.id\}\/quote/);
  });

  it("increments saved pricing profiles from the stored server version", () => {
    const saveProfileAction = actionsSource.slice(
      actionsSource.indexOf("export async function savePricingProfile"),
    );

    assert.match(saveProfileAction, /loadProfile\(supabase\)/);
    assert.match(saveProfileAction, /version:\s*currentProfile\.version \+ 1/);
    assert.doesNotMatch(saveProfileAction, /value_json:\s*toJson\(profile\)/);
  });
});
