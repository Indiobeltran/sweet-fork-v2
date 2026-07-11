import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { createWizardDraft, getPaletteState, hasMeaningfulWizardValues, isEditableFormTarget, parseWizardDraft, serializePaletteSelection } from "./wizard-state.ts";
import type { InquiryFormValues } from "@/lib/validations/inquiry";

const baseValues: InquiryFormValues = {
  eventType: "Birthday",
  eventDate: "2026-08-15",
  guestCount: 48,
  fulfillmentMethod: "pickup",
  deliveryZip: undefined,
  budgetRange: "150-300",
  budgetFlexibility: "moderate",
  orderItems: [
    {
      productType: "custom-cake",
      quantity: 1,
      servings: 24,
      flavorNotes: "Chocolate ganache\nVanilla bean",
      designNotes: "Blue ribbon\nGold edge",
      topperText: "Happy Birthday\nAdd stars",
      colorPalette: "Pastels, Blue - dusty blue and blush",
    },
    {
      productType: "cupcakes",
      quantity: 1,
      cupcakeCount: 36,
      flavorNotes: "Lemon curd",
    },
  ],
  colorPalette: "Neutrals - ivory and champagne",
  inspirationLinks: ["https://example.com/board"],
  inspirationText: "Soft garden mood\nPressed floral feel",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  customerPhone: "801-555-1234",
  preferredContact: "email",
  instagramHandle: undefined,
  howDidYouHear: "Referral",
  additionalNotes: "Please keep pickup flexible.",
};

describe("palette serialization", () => {
  it("serializes selected options and custom details into the existing string payload", () => {
    assert.equal(
      serializePaletteSelection(["pastels", "blue"], "dusty blue and blush"),
      "Pastels, Blue - dusty blue and blush",
    );
  });

  it("preserves in-progress palette details exactly while typing", () => {
    const serialized = serializePaletteSelection(
      ["pastels"],
      "dusty blue \nsecond line ",
    );

    assert.equal(serialized, "Pastels - dusty blue \nsecond line ");
    assert.deepEqual(getPaletteState(serialized), {
      selectedValues: ["pastels"],
      customDetails: "dusty blue \nsecond line ",
    });
  });

  it("makes no preference exclusive", () => {
    assert.equal(
      serializePaletteSelection(["pastels", "no-preference", "blue"], "ignored"),
      "No preference",
    );
  });

  it("renders legacy free-text palette values safely as custom details", () => {
    assert.deepEqual(getPaletteState("ivory, sage, soft gold"), {
      selectedValues: ["custom"],
      customDetails: "ivory, sage, soft gold",
    });
  });

  it("parses existing structured palette text with the prior delimiter", () => {
    assert.deepEqual(getPaletteState("Neutrals \u2014 ivory and champagne"), {
      selectedValues: ["neutrals"],
      customDetails: "ivory and champagne",
    });
  });
});

describe("editable keyboard targets", () => {
  it("lets native editable controls own Space and Enter behavior", () => {
    assert.equal(isEditableFormTarget({ tagName: "INPUT" }), true);
    assert.equal(isEditableFormTarget({ tagName: "TEXTAREA" }), true);
    assert.equal(isEditableFormTarget({ tagName: "SELECT" }), true);
    assert.equal(isEditableFormTarget({ tagName: "DIV", isContentEditable: true }), true);
    assert.equal(isEditableFormTarget({ tagName: "BUTTON" }), false);
  });
});

describe("wizard draft state", () => {
  it("does not silently preselect a budget flexibility option", () => {
    const parsed = parseWizardDraft(
      JSON.stringify({
        activeItemType: null,
        currentStep: 0,
        savedAt: new Date().toISOString(),
        values: {},
        version: 1,
      }),
    );

    assert.equal(parsed?.values.budgetFlexibility, "");
  });

  it("treats non-default preference choices as meaningful draft data", () => {
    assert.equal(
      hasMeaningfulWizardValues({
        ...baseValues,
        eventType: "",
        eventDate: "",
        guestCount: undefined,
        orderItems: [],
        colorPalette: undefined,
        inspirationLinks: [],
        inspirationText: undefined,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        howDidYouHear: undefined,
        additionalNotes: undefined,
        budgetRange: "300-600",
      }),
      true,
    );
  });

  it("round-trips serializable per-item details and the active step", () => {
    const draft = createWizardDraft({
      activeItemType: "custom-cake",
      currentStep: 3,
      values: baseValues,
    });

    const parsed = parseWizardDraft(JSON.stringify(draft));

    assert.equal(parsed?.currentStep, 3);
    assert.equal(parsed?.activeItemType, "custom-cake");
    assert.equal(parsed?.values.orderItems.length, 2);
    assert.equal(parsed?.values.orderItems[0].flavorNotes, "Chocolate ganache\nVanilla bean");
    assert.equal(parsed?.values.orderItems[0].topperText, "Happy Birthday\nAdd stars");
    assert.equal(parsed?.values.colorPalette, "Neutrals - ivory and champagne");
  });

  it("preserves raw in-progress item and palette whitespace in the serialized draft", () => {
    const draft = createWizardDraft({
      activeItemType: "custom-cake",
      currentStep: 2,
      values: {
        ...baseValues,
        colorPalette: "Pastels - dusty blue \nsecond line ",
        orderItems: [
          {
            ...baseValues.orderItems[0],
            flavorNotes: "White cake Bavarian Creme Filling. \nSecond line of notes. ",
            designNotes: "Chocolate cupcakes with ivory frosting. \nI don't know how you do this. ",
            colorPalette: "Blue - soft blue \nline two ",
          },
        ],
      },
    });

    const serialized = JSON.stringify(draft);
    const parsed = parseWizardDraft(serialized);

    assert.ok(
      serialized.includes("White cake Bavarian Creme Filling. \\nSecond line of notes. "),
    );
    assert.equal(
      parsed?.values.orderItems[0].flavorNotes,
      "White cake Bavarian Creme Filling. \nSecond line of notes. ",
    );
    assert.equal(parsed?.values.orderItems[0].colorPalette, "Blue - soft blue \nline two ");
    assert.equal(parsed?.values.colorPalette, "Pastels - dusty blue \nsecond line ");
  });

  it("drops an active item that is no longer selected", () => {
    const draft = createWizardDraft({
      activeItemType: "macarons",
      currentStep: 2,
      values: baseValues,
    });

    const parsed = parseWizardDraft(JSON.stringify(draft));

    assert.equal(parsed?.activeItemType, null);
  });
});

describe("start-order wizard source contracts", () => {
  it("keeps customer notes and wording fields multiline", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );

    assert.match(source, /<Textarea[\s\S]+id=\{`\$\{activeItem\.productType\}-topper`\}/);
    assert.match(source, /<Textarea[\s\S]+id=\{`\$\{activeItem\.productType\}-flavor`\}/);
    assert.match(source, /<Textarea[\s\S]+id=\{`\$\{activeItem\.productType\}-design`\}/);
    assert.match(source, /<Textarea[\s\S]+id="inspiration-text"/);
    assert.doesNotMatch(source, /const selectedItems = normalizedValues\.orderItems/);
  });

  it("fires the GA4 inquiry_submitted event from one code path only", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );
    const matches = source.match(/trackAnalyticsEvent\("inquiry_submitted"/g) ?? [];

    assert.equal(matches.length, 1);
  });

  it("does not horizontally scroll the wizard card to center step markers", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );

    assert.doesNotMatch(source, /stepMarkerRefs/);
    assert.doesNotMatch(source, /scrollIntoView\(\{[\s\S]*inline:\s*["']center["']/);
    assert.match(source, /wizardCardRef\.current\.scrollLeft = 0/);
  });

  it("keeps palette normalization multiline for final payload compatibility", async () => {
    const source = await readFile(
      new URL("../../lib/validations/inquiry.ts", import.meta.url),
      "utf8",
    );

    assert.match(
      source,
      /source\.colorPalette[\s\S]+sanitizeOptionalTextValue\(source\.colorPalette, \{ multiline: true \}\)/,
    );
    assert.match(
      source,
      /item\.colorPalette[\s\S]+sanitizeOptionalTextValue\(item\.colorPalette, \{ multiline: true \}\)/,
    );
  });

  it("derives normalized values without writing them back into live draft state", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );

    assert.match(source, /const normalizedValues = normalizeInquiryFormValues\(values\)/);
    assert.doesNotMatch(source, /setValues\(normalizedValues\)/);
    assert.doesNotMatch(source, /setValues\(normalizeInquiryFormValues/);
    assert.doesNotMatch(source, /const selectedItems = normalizedValues\.orderItems/);
  });

  it("restores saved drafts after hydration before persisting changes", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );

    assert.match(source, /const \[draftReady, setDraftReady\] = useState\(false\)/);
    assert.match(source, /useEffect\(\(\) => \{[\s\S]+readInitialWizardDraft\(\)[\s\S]+setDraftReady\(true\)/);
    assert.match(source, /if \(!draftReady \|\| typeof window === "undefined"\)/);
    assert.doesNotMatch(source, /useState\(readInitialWizardDraft\)/);
  });

  it("keeps admin inquiry detail wrappers constrained for long customer text", async () => {
    const source = await readFile(
      new URL("../../app/admin/(protected)/inquiries/[id]/page.tsx", import.meta.url),
      "utf8",
    );

    assert.match(source, /const userTextClass = "min-w-0 whitespace-pre-wrap break-words \[overflow-wrap:anywhere\]"/);
    assert.match(source, /function DetailRow[\s\S]+sm:flex-row[\s\S]+userTextClass/);
    assert.match(source, /detail\.items\.map[\s\S]+className="min-w-0 max-w-full rounded-\[1\.6rem\]/);
    assert.match(source, /xl:grid-cols-\[minmax\(0,1\.18fr\)_minmax\(0,0\.82fr\)\]/);
  });
});
