import { z } from "zod";

import type { PricingProfile, QuoteInput } from "./types";

const quoteStageKeys = [
  "planning",
  "shoppingPrep",
  "baking",
  "decorating",
  "packagingCleanup",
  "deliverySetup",
] as const;

const shortIdentifier = z.string().trim().min(1).max(100);
const shortLabel = z.string().trim().min(1).max(200);
const internalPricingTerms = /\b(?:internal|labou?r|hours?|margins?|overheads?|costs?|materials?|owner\s+rate|hourly\s+rate|profits?|markups?|warnings?)\b|\$\s*\d|\d+(?:\.\d+)?\s*%/i;
const customerFacingLabel = shortLabel.refine((value) => !internalPricingTerms.test(value), {
  message: "Product label cannot include internal pricing terms.",
});
const nonnegativeAmount = z.number().finite().nonnegative();
const positiveQuantity = z.number().finite().positive();
const boundedRate = z.number().finite().min(0).max(1);
const targetMarginRate = boundedRate.refine((value) => value < 1, {
  message: "targetMargin must be less than 1.",
});
const nonnegativeInteger = z.number().finite().int().nonnegative();
const positiveInteger = z.number().finite().int().positive();

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Must be a valid YYYY-MM-DD date.");

const adjustmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("fixed"), value: nonnegativeAmount }).strict(),
  z.object({ kind: z.literal("percentage"), value: boundedRate }).strict(),
]);

const partialStageHoursShape = Object.fromEntries(
  quoteStageKeys.map((stage) => [stage, nonnegativeAmount.optional()]),
) as Record<(typeof quoteStageKeys)[number], z.ZodOptional<typeof nonnegativeAmount>>;

const stageHoursShape = Object.fromEntries(
  quoteStageKeys.map((stage) => [stage, nonnegativeAmount]),
) as Record<(typeof quoteStageKeys)[number], typeof nonnegativeAmount>;

const quoteSpecialCostSchema = z.object({
  id: shortIdentifier,
  label: shortLabel,
  quantity: positiveQuantity.optional(),
  unitCost: nonnegativeAmount,
}).strict();

const quoteLinePricingSchema = z.object({
  materialAllowance: nonnegativeAmount.optional(),
  packagingAllowance: nonnegativeAmount.optional(),
  source: z.enum(["preset", "manual"]).optional(),
  stageHours: z.object(partialStageHoursShape).strict().optional(),
}).strict();

const quoteLineSchema = z.object({
  complexityKey: shortIdentifier,
  id: shortIdentifier,
  pricing: quoteLinePricingSchema.optional(),
  productKey: shortIdentifier,
  quantity: positiveQuantity.int().optional(),
  specialCosts: z.array(quoteSpecialCostSchema).max(100).optional(),
}).strict();

export const quoteInputSchema = z.object({
  contingency: adjustmentSchema.optional(),
  delivery: z.object({
    roundTripMiles: nonnegativeAmount,
    setupHours: nonnegativeAmount,
    tollsParking: nonnegativeAmount.optional(),
  }).strict().optional(),
  depositRate: boundedRate.optional(),
  discount: adjustmentSchema.optional(),
  finalPrice: nonnegativeAmount.optional(),
  issuedOn: dateKeySchema.optional(),
  lines: z.array(quoteLineSchema).min(1).max(50),
  rush: adjustmentSchema.optional(),
  taxRate: boundedRate.optional(),
  validityDays: nonnegativeInteger.optional(),
}).strict();

const pricingPresetSchema = z.object({
  materialAllowance: nonnegativeAmount,
  packagingAllowance: nonnegativeAmount,
  stageHours: z.object(stageHoursShape).strict(),
}).strict();

const productPricingPresetSchema = z.object({
  complexities: z.record(shortIdentifier, pricingPresetSchema).refine(
    (complexities) => Object.keys(complexities).length > 0,
    "At least one complexity is required.",
  ),
  label: customerFacingLabel,
  publicStartingPrice: nonnegativeAmount.optional(),
}).strict();

export const pricingProfileSchema = z.object({
  currency: z.literal("USD"),
  defaultDepositRate: boundedRate,
  defaultQuoteValidityDays: nonnegativeInteger,
  defaultTaxRate: boundedRate,
  delivery: z.object({
    mileageRate: nonnegativeAmount,
    minimumCharge: nonnegativeAmount.optional(),
  }).strict(),
  fixedOverheadPerOrder: nonnegativeAmount,
  minimumMargin: targetMarginRate,
  ownerHourlyRate: nonnegativeAmount,
  productPresets: z.record(shortIdentifier, productPricingPresetSchema).refine(
    (presets) => Object.keys(presets).length > 0,
    "At least one product preset is required.",
  ),
  profileId: shortIdentifier,
  targetMargin: targetMarginRate,
  variableOverheadRate: boundedRate,
  version: positiveInteger,
}).strict().superRefine((profile, context) => {
  if (profile.minimumMargin > profile.targetMargin) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "minimumMargin cannot exceed targetMargin.",
      path: ["minimumMargin"],
    });
  }
});

const customerScopeSchema = z.string().trim().min(1, "Customer scope is required.").max(2_000)
  .refine((value) => !internalPricingTerms.test(value), {
    message: "Customer scope cannot include internal pricing terms.",
  });
const customerMessageSchema = z.string().trim().min(1, "Customer message is required.").max(5_000);

export function parseQuoteInput(value: unknown): QuoteInput {
  return quoteInputSchema.parse(value) as QuoteInput;
}

export function parsePricingProfile(value: unknown): PricingProfile {
  return pricingProfileSchema.parse(value) as PricingProfile;
}

export function parseCustomerScope(value: unknown) {
  return customerScopeSchema.parse(value);
}

export function parseCustomerMessage(value: unknown) {
  return customerMessageSchema.parse(value);
}
