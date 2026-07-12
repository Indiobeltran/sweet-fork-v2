// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { calculateQuote } from "./pricing-engine.ts";
import type { PricingProfile, QuoteCalculation, QuoteInput } from "./types";
// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { parsePricingProfile, parseQuoteInput } from "./validation.ts";

export type QuoteSnapshot = {
  calculation: QuoteCalculation;
  input: QuoteInput;
  profile: PricingProfile;
};

type InquiryItemForQuote = {
  id: string;
  product_type: string;
  quantity: number;
  sort_order: number;
};

type QuoteVersionLike = {
  is_current: boolean;
  version: number;
};

function formatDateKey(value: string) {
  const parsed = parseQuoteInput({
    issuedOn: value,
    lines: [{ complexityKey: "date-check", id: "date-check", productKey: "date-check" }],
  });
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${parsed.issuedOn}T12:00:00.000Z`));
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function normalizeForComparison(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, normalizeForComparison(nestedValue)]),
    );
  }

  return value;
}

function cloneSnapshot(snapshot: QuoteSnapshot): QuoteSnapshot {
  return structuredClone(snapshot);
}

export function buildQuoteSnapshot(profileValue: unknown, inputValue: unknown): QuoteSnapshot {
  const profile = parsePricingProfile(profileValue);
  const input = parseQuoteInput(inputValue);
  const calculation = calculateQuote(profile, input);

  return cloneSnapshot({ calculation, input, profile });
}

export function parseQuoteSnapshot(value: unknown): QuoteSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Quote snapshot must be an object.");
  }

  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "calculation,input,profile") {
    throw new Error("Quote snapshot must contain only input, calculation, and profile.");
  }

  const raw = value as Record<string, unknown>;
  const snapshot = buildQuoteSnapshot(raw.profile, raw.input);
  const suppliedCalculation = JSON.stringify(normalizeForComparison(raw.calculation));
  const expectedCalculation = JSON.stringify(normalizeForComparison(snapshot.calculation));

  if (suppliedCalculation !== expectedCalculation) {
    throw new Error("Quote snapshot calculation does not match its input and profile.");
  }

  return snapshot;
}

const customerProductLabels: Record<string, string> = {
  "custom-cake": "Custom cake",
  "wedding-cake": "Wedding cake",
  cupcakes: "Cupcakes",
  "sugar-cookies": "Sugar cookies",
  macarons: "Macarons",
  "diy-kit": "DIY kit",
};

export function buildDefaultCustomerScope(input: QuoteInput, profile?: PricingProfile) {
  return input.lines
    .map((line) => {
      const quantity = line.quantity ?? 1;
      const label =
        profile?.productPresets[line.productKey]?.label ??
        customerProductLabels[line.productKey] ??
        "Custom bakery item";
      return `${quantity} × ${label}`;
    })
    .join("; ");
}

export function buildDefaultCustomerMessage({
  calculation,
  eventDate,
  scope,
}: {
  calculation: QuoteCalculation;
  eventDate: string;
  scope: string;
}) {
  if (!calculation.metadata.validThrough) {
    throw new Error("A valid-through date is required for customer quote copy.");
  }

  return [
    `Scope: ${scope}`,
    `Event date: ${formatDateKey(eventDate)}`,
    `Quote total: ${formatUsd(calculation.pricing.customerTotal)}`,
    `Deposit: ${formatUsd(calculation.pricing.depositAmount)}`,
    `Valid through: ${formatDateKey(calculation.metadata.validThrough)}`,
    "Next step: Reply to approve this quote and receive your invoice and deposit instructions.",
  ].join("\n");
}

export function normalizeInquiryItemsToQuoteInput(
  items: InquiryItemForQuote[],
  fulfillmentMethod: "delivery" | "pickup",
  issuedOn: string,
): QuoteInput {
  return parseQuoteInput({
    ...(fulfillmentMethod === "delivery"
      ? { delivery: { roundTripMiles: 0, setupHours: 0, tollsParking: 0 } }
      : {}),
    issuedOn,
    lines: [...items]
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((item) => ({
        complexityKey: "standard",
        id: item.id,
        productKey: item.product_type,
        quantity: item.quantity,
      })),
  });
}

export function getCurrentQuoteVersion<T extends QuoteVersionLike>(quotes: T[]) {
  const currentQuotes = quotes.filter((quote) => quote.is_current);

  if (currentQuotes.length > 1) {
    throw new Error("Inquiry has more than one current quote.");
  }

  return currentQuotes[0] ?? null;
}

export function getNextQuoteVersion(quotes: Array<Pick<QuoteVersionLike, "version">>) {
  return quotes.reduce((highest, quote) => {
    if (!Number.isInteger(quote.version) || quote.version < 1) {
      throw new Error("Saved quote versions must be positive integers.");
    }
    return Math.max(highest, quote.version);
  }, 0) + 1;
}
