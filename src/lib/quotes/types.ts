export const quoteStageKeys = [
  "planning",
  "shoppingPrep",
  "baking",
  "decorating",
  "packagingCleanup",
  "deliverySetup",
] as const;

export type QuoteStageKey = (typeof quoteStageKeys)[number];
export type StageHours = Record<QuoteStageKey, number>;
export type PartialStageHours = Partial<StageHours>;

export type PricingPreset = {
  materialAllowance: number;
  packagingAllowance: number;
  stageHours: StageHours;
};

export type ProductPricingPreset = {
  complexities: Record<string, PricingPreset>;
  label: string;
  publicStartingPrice?: number;
};

export type PricingProfile = {
  currency: "USD";
  defaultDepositRate: number;
  defaultQuoteValidityDays: number;
  defaultTaxRate: number;
  delivery: {
    mileageRate: number;
    minimumCharge?: number;
  };
  fixedOverheadPerOrder: number;
  minimumMargin: number;
  ownerHourlyRate: number;
  productPresets: Record<string, ProductPricingPreset>;
  profileId: string;
  targetMargin: number;
  variableOverheadRate: number;
  version: number;
};

export type QuoteAdjustmentInput = {
  kind: "fixed" | "percentage";
  value: number;
};

export type QuoteSpecialCostInput = {
  id: string;
  label: string;
  quantity?: number;
  unitCost: number;
};

export type QuoteLinePricingInput = {
  materialAllowance?: number;
  packagingAllowance?: number;
  source?: "preset" | "manual";
  stageHours?: PartialStageHours;
};

export type QuoteLineInput = {
  complexityKey: string;
  id: string;
  pricing?: QuoteLinePricingInput;
  productKey: string;
  quantity?: number;
  specialCosts?: QuoteSpecialCostInput[];
};

export type QuoteDeliveryInput = {
  roundTripMiles: number;
  setupHours: number;
  tollsParking?: number;
};

export type QuoteInput = {
  contingency?: QuoteAdjustmentInput;
  delivery?: QuoteDeliveryInput;
  depositRate?: number;
  discount?: QuoteAdjustmentInput;
  finalPrice?: number;
  issuedOn?: string;
  lines: QuoteLineInput[];
  rush?: QuoteAdjustmentInput;
  taxRate?: number;
  validityDays?: number;
};

export type QuoteWarningCode =
  | "MISSING_PRESET"
  | "MANUAL_FALLBACK"
  | "BELOW_COST"
  | "BELOW_MINIMUM_MARGIN"
  | "BELOW_PUBLIC_STARTING_PRICE";

export type QuoteWarning = {
  code: QuoteWarningCode;
  lineId?: string;
  message: string;
};

export type QuoteLineCalculation = {
  complexityKey: string;
  id: string;
  materialAllowance: number;
  packagingAllowance: number;
  pricingSource: "preset" | "manual" | "missing";
  productKey: string;
  quantity: number;
  specialCosts: Array<Required<QuoteSpecialCostInput> & { totalCost: number }>;
  stageHours: StageHours;
  totalHours: number;
};

export type QuoteDeliveryCalculation = {
  appliedCost: number;
  laborCost: number;
  mileageCost: number;
  minimumAdjustment: number;
  roundTripMiles: number;
  setupHours: number;
  tollsParking: number;
};

export type QuoteCalculation = {
  adjustments: {
    contingency: number;
    discount: number;
    rush: number;
    tax: number;
  };
  costs: {
    contingency: number;
    deliveryExpenses: number;
    fixedOverhead: number;
    internalTotal: number;
    labor: number;
    materials: number;
    overheadBasis: number;
    packaging: number;
    specialCosts: number;
    variableOverhead: number;
  };
  delivery: QuoteDeliveryCalculation | null;
  lines: QuoteLineCalculation[];
  metadata: {
    issuedOn: string | null;
    validityDays: number;
    validThrough: string | null;
  };
  pricing: {
    balanceDue: number;
    customerTotal: number;
    depositAmount: number;
    finalPrice: number;
    margin: number | null;
    publicStartingTotal: number;
    recommendedPrice: number;
    suggestedPrice: number;
    suggestedPriceUnrounded: number;
  };
  profile: {
    currency: "USD";
    profileId: string;
    version: number;
  };
  warnings: QuoteWarning[];
};
