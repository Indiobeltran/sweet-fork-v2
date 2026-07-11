import type { InquiryFormValues } from "@/lib/validations/inquiry";
import type { ProductType } from "@/types/domain";

export const wizardDraftStorageKey = "sweet-fork:start-order:draft:v1";
export const wizardDraftVersion = 1;
export const maxWizardStepIndex = 4;

export const colorPaletteOptions = [
  { value: "no-preference", label: "No preference" },
  { value: "neutrals", label: "Neutrals" },
  { value: "pastels", label: "Pastels" },
  { value: "pink-red", label: "Pink / Red" },
  { value: "orange-yellow", label: "Orange / Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "black-white", label: "Black / White" },
  { value: "metallics", label: "Metallics" },
  { value: "seasonal", label: "Seasonal" },
  { value: "custom", label: "Custom" },
] as const;

export type ColorPaletteValue = (typeof colorPaletteOptions)[number]["value"];

export type PaletteState = {
  selectedValues: ColorPaletteValue[];
  customDetails: string;
};

export type WizardDraft = {
  activeItemType: ProductType | null;
  currentStep: number;
  savedAt: string;
  values: InquiryFormValues;
  version: typeof wizardDraftVersion;
};

type EditableTargetLike = {
  isContentEditable?: boolean | null;
  tagName?: string | null;
};

const paletteLabelByValue = new Map<ColorPaletteValue, string>(
  colorPaletteOptions.map((option) => [option.value, option.label]),
);

const paletteDetailsDelimiter = " - ";
const legacyPaletteDetailsDelimiter = "\u2014";
const paletteValueSet = new Set<string>(
  colorPaletteOptions.map((option) => option.value),
);
const paletteValueByLabel = new Map<string, ColorPaletteValue>(
  colorPaletteOptions.map((option) => [option.label.toLowerCase(), option.value]),
);
const productTypeSet = new Set<string>([
  "custom-cake",
  "wedding-cake",
  "cupcakes",
  "sugar-cookies",
  "macarons",
  "diy-kit",
]);
const budgetRangeSet = new Set<string>([
  "under-150",
  "150-300",
  "300-600",
  "600-1000",
  "1000-2000",
  "2000-plus",
  "not-sure",
  "under-75",
  "75-150",
  "300-500",
  "500-plus",
]);
const budgetFlexibilitySet = new Set<string>(["firm", "moderate", "open"]);
const fulfillmentMethodSet = new Set<string>(["pickup", "delivery"]);
const preferredContactSet = new Set<string>(["email", "text", "phone"]);

function hasVisibleText(value: string | undefined) {
  return /\S/.test(value ?? "");
}

function isColorPaletteValue(value: string): value is ColorPaletteValue {
  return paletteValueSet.has(value);
}

function normalizePaletteSelection(values: readonly string[]): ColorPaletteValue[] {
  const uniqueValues: ColorPaletteValue[] = [];

  values.forEach((value) => {
    if (isColorPaletteValue(value) && !uniqueValues.includes(value)) {
      uniqueValues.push(value);
    }
  });

  if (uniqueValues.includes("no-preference")) {
    return ["no-preference"];
  }

  return uniqueValues.filter((value) => value !== "no-preference");
}

function getKnownPaletteValues(labels: string) {
  return labels
    .split(",")
    .map((label) => paletteValueByLabel.get(label.trim().toLowerCase()))
    .filter((value): value is ColorPaletteValue => Boolean(value));
}

function getSafeProductType(value: unknown) {
  return typeof value === "string" && productTypeSet.has(value)
    ? (value as ProductType)
    : null;
}

function getRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getEnumValue<T extends string>(
  value: unknown,
  allowedValues: Set<string>,
  fallback: T,
) {
  return typeof value === "string" && allowedValues.has(value) ? (value as T) : fallback;
}

function getDraftDefaults(): InquiryFormValues {
  return {
    eventType: "",
    eventDate: "",
    guestCount: undefined,
    fulfillmentMethod: "pickup",
    deliveryZip: undefined,
    budgetRange: "not-sure",
    budgetFlexibility: "" as InquiryFormValues["budgetFlexibility"],
    orderItems: [],
    colorPalette: undefined,
    inspirationLinks: [],
    inspirationText: undefined,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    instagramHandle: undefined,
    preferredContact: "email",
    howDidYouHear: undefined,
    additionalNotes: undefined,
  };
}

function parseDraftOrderItem(value: unknown): InquiryFormValues["orderItems"][number] | null {
  const source = getRecord(value);
  const productType = getSafeProductType(source.productType);

  if (!productType) {
    return null;
  }

  return {
    productType,
    quantity: getNumber(source.quantity) ?? 1,
    servings: getNumber(source.servings),
    flavorNotes: getOptionalString(source.flavorNotes),
    designNotes: getOptionalString(source.designNotes),
    inspirationNotes: getOptionalString(source.inspirationNotes),
    sizeLabel: getOptionalString(source.sizeLabel),
    tiers: getNumber(source.tiers),
    shape: getOptionalString(source.shape) as InquiryFormValues["orderItems"][number]["shape"],
    icingStyle: getOptionalString(source.icingStyle) as InquiryFormValues["orderItems"][number]["icingStyle"],
    cupcakeCount: getNumber(source.cupcakeCount),
    cookieCount: getNumber(source.cookieCount),
    macaronCount: getNumber(source.macaronCount),
    kitCount: getNumber(source.kitCount),
    weddingServings: getNumber(source.weddingServings),
    topperText: getOptionalString(source.topperText),
    colorPalette: getOptionalString(source.colorPalette),
  };
}

function parseDraftValues(value: unknown): InquiryFormValues {
  const defaults = getDraftDefaults();
  const source = getRecord(value);
  const orderItems = Array.isArray(source.orderItems)
    ? source.orderItems
        .map(parseDraftOrderItem)
        .filter((item): item is InquiryFormValues["orderItems"][number] => Boolean(item))
    : [];
  const inspirationLinks = Array.isArray(source.inspirationLinks)
    ? source.inspirationLinks.filter((entry): entry is string => typeof entry === "string")
    : [];

  return {
    ...defaults,
    eventType: getString(source.eventType),
    eventDate: getString(source.eventDate),
    guestCount: getNumber(source.guestCount),
    fulfillmentMethod: getEnumValue(
      source.fulfillmentMethod,
      fulfillmentMethodSet,
      defaults.fulfillmentMethod,
    ),
    deliveryZip: getOptionalString(source.deliveryZip),
    budgetRange: getEnumValue(source.budgetRange, budgetRangeSet, defaults.budgetRange),
    budgetFlexibility: getEnumValue(
      source.budgetFlexibility,
      budgetFlexibilitySet,
      defaults.budgetFlexibility,
    ),
    orderItems,
    colorPalette: getOptionalString(source.colorPalette),
    inspirationLinks,
    inspirationText: getOptionalString(source.inspirationText),
    customerName: getString(source.customerName),
    customerEmail: getString(source.customerEmail),
    customerPhone: getString(source.customerPhone),
    instagramHandle: getOptionalString(source.instagramHandle),
    preferredContact: getEnumValue(
      source.preferredContact,
      preferredContactSet,
      defaults.preferredContact,
    ),
    howDidYouHear: getOptionalString(source.howDidYouHear),
    additionalNotes: getOptionalString(source.additionalNotes),
  };
}

function clampStep(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(maxWizardStepIndex, Math.trunc(value)));
}

export function isEditableFormTarget(target: EditableTargetLike | null | undefined) {
  const tagName = target?.tagName?.toUpperCase();

  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    Boolean(target?.isContentEditable)
  );
}

export function serializePaletteSelection(
  selectedValues: readonly string[],
  customDetails?: string,
) {
  const normalizedSelection = normalizePaletteSelection(selectedValues);
  const details = customDetails ?? "";

  if (normalizedSelection.includes("no-preference")) {
    return "No preference";
  }

  const labels = normalizedSelection
    .map((value) => paletteLabelByValue.get(value))
    .filter((label): label is string => Boolean(label));

  if (labels.length === 0) {
    return details || undefined;
  }

  const labelText = labels.join(", ");
  return details.length > 0
    ? `${labelText}${paletteDetailsDelimiter}${details}`
    : labelText;
}

export function getPaletteState(value: string | null | undefined): PaletteState {
  const text = value ?? "";

  if (!hasVisibleText(text)) {
    return {
      selectedValues: [],
      customDetails: "",
    };
  }

  const delimiter = text.includes(paletteDetailsDelimiter)
    ? paletteDetailsDelimiter
    : text.includes(legacyPaletteDetailsDelimiter)
      ? legacyPaletteDetailsDelimiter
      : "";
  const [labelText, ...detailParts] = delimiter ? text.split(delimiter) : [text];
  const knownValues = getKnownPaletteValues(labelText);
  const normalizedSelection = normalizePaletteSelection(knownValues);
  const details =
    delimiter === legacyPaletteDetailsDelimiter
      ? detailParts.join(delimiter).trim()
      : detailParts.join(delimiter);

  if (normalizedSelection.length > 0) {
    return {
      selectedValues: normalizedSelection,
      customDetails: detailParts.length > 0 ? details : "",
    };
  }

  return {
    selectedValues: ["custom"],
    customDetails: text,
  };
}

export function hasMeaningfulWizardValues(values: InquiryFormValues) {
  return Boolean(
    values.eventType ||
      values.eventDate ||
      values.guestCount ||
      values.fulfillmentMethod !== "pickup" ||
      values.deliveryZip ||
      values.budgetRange !== "not-sure" ||
      Boolean(values.budgetFlexibility) ||
      values.orderItems.length > 0 ||
      values.colorPalette ||
      values.inspirationLinks.length > 0 ||
      values.inspirationText ||
      values.customerName ||
      values.customerEmail ||
      values.customerPhone ||
      values.instagramHandle ||
      values.preferredContact !== "email" ||
      values.howDidYouHear ||
      values.additionalNotes,
  );
}

export function createWizardDraft({
  activeItemType,
  currentStep,
  values,
}: {
  activeItemType: ProductType | null;
  currentStep: number;
  values: InquiryFormValues;
}): WizardDraft {
  const selectedProductTypes = new Set(values.orderItems.map((item) => item.productType));
  const safeActiveItemType =
    activeItemType && selectedProductTypes.has(activeItemType) ? activeItemType : null;

  return {
    activeItemType: safeActiveItemType,
    currentStep: clampStep(currentStep),
    savedAt: new Date().toISOString(),
    values: JSON.parse(JSON.stringify(values)) as InquiryFormValues,
    version: wizardDraftVersion,
  };
}

export function parseWizardDraft(rawValue: string | null | undefined): WizardDraft | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<WizardDraft> & {
      values?: unknown;
    };

    if (parsed.version !== wizardDraftVersion || !parsed.values) {
      return null;
    }

    const values = parseDraftValues(parsed.values);
    const activeItemType = getSafeProductType(parsed.activeItemType);
    const selectedProductTypes = new Set(values.orderItems.map((item) => item.productType));

    return {
      activeItemType:
        activeItemType && selectedProductTypes.has(activeItemType) ? activeItemType : null,
      currentStep: clampStep(parsed.currentStep),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      values,
      version: wizardDraftVersion,
    };
  } catch {
    return null;
  }
}
