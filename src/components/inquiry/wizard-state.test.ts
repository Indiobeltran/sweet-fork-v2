import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { createWizardDraft, getPaletteState, hasMeaningfulWizardValues, isEditableFormTarget, parseWizardDraft, serializePaletteSelection } from "./wizard-state.ts";
// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { sanitizeTextValue } from "../../lib/validations/text.ts";
// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { MAX_INSPIRATION_LINKS, getInvalidInspirationLinkIndex, normalizeInspirationLinks } from "../../lib/validations/inspiration-links.ts";
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
    assert.deepEqual(parsed?.values.inspirationLinks, [
      "https://example.com/board",
    ]);
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

describe("URL-only inspiration references", () => {
  it("normalizes practical bare domains while preserving explicit URLs", () => {
    assert.deepEqual(
      normalizeInspirationLinks([
        " pinterest.com/sweet-fork/board ",
        "",
        "https://www.instagram.com/p/ABC123/?utm_source=customer",
        "drive.google.com/file/d/example/view\n\ndropbox.com/s/example/cake.jpg",
      ]),
      [
        "https://pinterest.com/sweet-fork/board",
        "https://www.instagram.com/p/ABC123/?utm_source=customer",
        "https://drive.google.com/file/d/example/view",
        "https://dropbox.com/s/example/cake.jpg",
      ],
    );
  });

  it("identifies an invalid line without discarding the other entries", () => {
    const links = normalizeInspirationLinks([
      "pinterest.com/example",
      "not a public link",
      "https://examplebakery.com/gallery",
    ]);

    assert.deepEqual(links, [
      "https://pinterest.com/example",
      "not a public link",
      "https://examplebakery.com/gallery",
    ]);
    assert.equal(getInvalidInspirationLinkIndex(links), 1);
  });

  it("keeps the optional field empty and bounds link count", () => {
    assert.deepEqual(normalizeInspirationLinks([]), []);
    assert.equal(MAX_INSPIRATION_LINKS, 6);
  });
});

describe("multiline inquiry normalization", () => {
  it("preserves meaningful spaces and line breaks in wording, flavor, and design notes", () => {
    assert.equal(
      sanitizeTextValue("Happy Birthday Ava\nLove, Mom and Dad", {
        multiline: true,
      }),
      "Happy Birthday Ava\nLove, Mom and Dad",
    );
    assert.equal(
      sanitizeTextValue(
        "White cake with Bavarian cream\nFresh raspberry layer",
        { multiline: true },
      ),
      "White cake with Bavarian cream\nFresh raspberry layer",
    );
    assert.equal(
      sanitizeTextValue("Soft blue ribbon\nSmall gold stars", {
        multiline: true,
      }),
      "Soft blue ribbon\nSmall gold stars",
    );
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

  it("fires generate_lead from one post-persistence code path only", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );
    const matches =
      source.match(/emitGenerateLeadAfterPersistence\(\{/g) ?? [];

    assert.equal(matches.length, 1);
    assert.doesNotMatch(source, /trackAnalyticsEvent\("inquiry_submitted"/);
    assert.match(
      source,
      /const payload = await submitInquiryRequest\([\s\S]+emitGenerateLeadAfterPersistence\(\{[\s\S]+confirmation: payload/,
    );
  });

  it("does not reintroduce unsupported customer image uploads", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );

    assert.doesNotMatch(source, /type=["']file["']/);
    assert.doesNotMatch(source, /inspirationFiles/);
  });

  it("uses one optional newline-separated inspiration-link field", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );

    assert.match(source, /Inspiration links \(optional\)/);
    assert.match(source, /Pinterest, Instagram, Google Drive, Dropbox, bakery sites/);
    assert.match(source, /separate multiple links with[\s\S]+a new line/);
    assert.match(source, /placeholder="https:\/\/www\.pinterest\.com\/\.\.\."/);
    assert.match(source, /value=\{values\.inspirationLinks\.join\("\\n"\)\}/);
  });

  it("submits JSON and keeps customer files out of the public API", async () => {
    const [clientSource, routeSource] = await Promise.all([
      readFile(
        new URL("../../lib/inquiries/client-submit.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../../app/api/inquiries/route.ts", import.meta.url),
        "utf8",
      ),
    ]);

    assert.match(clientSource, /"Content-Type": "application\/json"/);
    assert.doesNotMatch(clientSource, /FormData|multipart|inspirationFiles/);
    assert.doesNotMatch(routeSource, /\.formData\(\)|multipart|inspirationFiles/);
    assert.match(routeSource, /contentType\.startsWith\("application\/json"\)/);
  });

  it("stores reference links and exposes them in authenticated inquiry detail", async () => {
    const [submitSource, adminDataSource, adminPageSource] = await Promise.all([
      readFile(
        new URL("../../lib/inquiries/submit.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../../lib/admin/inquiries.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../../app/admin/(protected)/inquiries/[id]/page.tsx", import.meta.url),
        "utf8",
      ),
    ]);

    assert.match(submitSource, /asset_type: "reference-link"/);
    assert.match(submitSource, /external_url: link/);
    assert.match(adminDataSource, /asset\.asset_type === "reference-link"/);
    assert.match(adminPageSource, /Open reference/);
    assert.match(adminPageSource, /Inspiration references/);
  });

  it("keeps required-field validation contracts for every wizard stage", async () => {
    const source = await readFile(
      new URL("../../lib/validations/inquiry.ts", import.meta.url),
      "utf8",
    );

    for (const contract of [
      /eventType: z\.string\(\)\.trim\(\)\.min\(2, "Tell us what you are celebrating\."\)/,
      /\.min\(1, "Choose your event date\."\)/,
      /budgetRange: z\.enum\(budgetRangeValues/,
      /budgetFlexibility: z\.enum\(budgetFlexibilityValues/,
      /"Delivery requests need a ZIP code\."/,
      /\.min\(1, "Select at least one product to continue\."\)/,
      /"Cake selections need an estimated serving count\."/,
      /"Cupcake count is required\."/,
      /"Cookie count is required\."/,
      /"Macaron count is required\."/,
      /"DIY kit quantity is required\."/,
      /customerName: z\.string\(\)\.trim\(\)\.min\(2, "Enter your name\."\)/,
      /customerEmail: z\.string\(\)\.trim\(\)\.email\("Enter a valid email address\."\)/,
      /customerPhone: z[\s\S]+\.min\(10, "Enter a valid phone number with area code\."\)/,
      /preferredContact: z\.enum\(\["email", "text", "phone"\]\)/,
    ]) {
      assert.match(source, contract);
    }
  });

  it("emits validation analytics only for advance or submit attempts", async () => {
    const source = await readFile(
      new URL("./start-order-wizard.tsx", import.meta.url),
      "utf8",
    );

    assert.match(
      source,
      /validateStepOnBlur[\s\S]+!attemptedStepsRef\.current\.has\(stepIndex\)[\s\S]+trackErrors: false/,
    );
    assert.match(
      source,
      /const goToNextStep = \(\) => \{[\s\S]+attemptedStepsRef\.current\.add\(currentStep\);[\s\S]+validateStep\(currentStep\)/,
    );
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
