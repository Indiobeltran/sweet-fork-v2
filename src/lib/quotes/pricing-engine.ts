import type {
  PricingProfile,
  QuoteAdjustmentInput,
  QuoteCalculation,
  QuoteInput,
  QuoteWarning,
  StageHours,
} from "./types";

const quoteStageKeys = [
  "planning",
  "shoppingPrep",
  "baking",
  "decorating",
  "packagingCleanup",
  "deliverySetup",
] as const;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function assertFinite(value: number, path: string, options: { allowZero?: boolean } = {}) {
  if (!Number.isFinite(value)) {
    throw new Error(`${path} must be finite.`);
  }

  if (options.allowZero ? value < 0 : value <= 0) {
    throw new Error(`${path} must be ${options.allowZero ? "zero or greater" : "greater than 0"}.`);
  }
}

function assertRate(value: number, path: string, allowOne = false) {
  assertFinite(value, path, { allowZero: true });
  if (allowOne ? value > 1 : value >= 1) {
    throw new Error(`${path} must be ${allowOne ? "1 or less" : "less than 1"}.`);
  }
}

function adjustmentAmount(adjustment: QuoteAdjustmentInput | undefined, basis: number) {
  if (!adjustment) {
    return 0;
  }

  assertFinite(adjustment.value, "adjustment.value", { allowZero: true });
  if (adjustment.kind === "percentage" && adjustment.value > 1) {
    throw new Error("adjustment.value must be 1 or less.");
  }
  return roundMoney(adjustment.kind === "percentage" ? basis * adjustment.value : adjustment.value);
}

function addDays(dateKey: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("input.issuedOn must use YYYY-MM-DD format.");
  }

  const date = new Date(`${dateKey}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateKey) {
    throw new Error("input.issuedOn must be a valid date.");
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calculateQuote(
  profile: PricingProfile,
  input: QuoteInput,
): QuoteCalculation {
  assertFinite(profile.ownerHourlyRate, "profile.ownerHourlyRate", { allowZero: true });
  if (!Number.isInteger(profile.version) || profile.version <= 0) {
    throw new Error("profile.version must be a positive integer.");
  }
  assertFinite(profile.fixedOverheadPerOrder, "profile.fixedOverheadPerOrder", { allowZero: true });
  assertRate(profile.variableOverheadRate, "profile.variableOverheadRate", true);
  assertRate(profile.targetMargin, "profile.targetMargin");
  assertRate(profile.minimumMargin, "profile.minimumMargin");
  assertFinite(profile.delivery.mileageRate, "profile.delivery.mileageRate", { allowZero: true });
  assertFinite(profile.delivery.minimumCharge ?? 0, "profile.delivery.minimumCharge", { allowZero: true });
  Object.entries(profile.productPresets).forEach(([productKey, preset]) => {
    if (preset.publicStartingPrice !== undefined) {
      assertFinite(
        preset.publicStartingPrice,
        `profile.productPresets.${productKey}.publicStartingPrice`,
        { allowZero: true },
      );
    }
  });

  const warnings: QuoteWarning[] = [];
  const lines = input.lines.map((line, lineIndex) => {
    const path = `input.lines[${lineIndex}]`;
    const quantity = line.quantity ?? 1;
    assertFinite(quantity, `${path}.quantity`);

    const productPreset = profile.productPresets[line.productKey];
    const preset = productPreset?.complexities[line.complexityKey];
    const manualPricing = line.pricing;

    if (!preset) {
      warnings.push({
        code: "MISSING_PRESET",
        lineId: line.id,
        message: `No ${line.complexityKey} preset exists for this product.`,
      });
    }

    if (!preset && manualPricing) {
      warnings.push({
        code: "MANUAL_FALLBACK",
        lineId: line.id,
        message: "This line uses manually entered pricing assumptions.",
      });
    }

    const source = manualPricing?.source === "manual" || !preset ? manualPricing : undefined;
    const stageHours = Object.fromEntries(
      quoteStageKeys.map((stage) => {
        const rawHours = source?.stageHours?.[stage] ?? preset?.stageHours[stage] ?? 0;
        assertFinite(rawHours, `${path}.stageHours.${stage}`, { allowZero: true });
        return [stage, roundMoney(rawHours * quantity)];
      }),
    ) as StageHours;

    const rawMaterialAllowance = source?.materialAllowance ?? preset?.materialAllowance ?? 0;
    const rawPackagingAllowance = source?.packagingAllowance ?? preset?.packagingAllowance ?? 0;
    assertFinite(rawMaterialAllowance, `${path}.materialAllowance`, { allowZero: true });
    assertFinite(rawPackagingAllowance, `${path}.packagingAllowance`, { allowZero: true });

    const specialCosts = (line.specialCosts ?? []).map((specialCost, specialCostIndex) => {
      const specialCostQuantity = specialCost.quantity ?? 1;
      assertFinite(
        specialCost.unitCost,
        `${path}.specialCosts[${specialCostIndex}].unitCost`,
        { allowZero: true },
      );
      assertFinite(
        specialCostQuantity,
        `${path}.specialCosts[${specialCostIndex}].quantity`,
      );

      return {
        ...specialCost,
        quantity: specialCostQuantity,
        totalCost: roundMoney(specialCost.unitCost * specialCostQuantity),
      };
    });

    return {
      complexityKey: line.complexityKey,
      id: line.id,
      materialAllowance: roundMoney(rawMaterialAllowance * quantity),
      packagingAllowance: roundMoney(rawPackagingAllowance * quantity),
      pricingSource: preset && !source ? "preset" as const : source ? "manual" as const : "missing" as const,
      productKey: line.productKey,
      quantity,
      specialCosts,
      stageHours,
      totalHours: roundMoney(sum(Object.values(stageHours))),
    };
  });

  let delivery = null;
  let deliveryLabor = 0;
  let deliveryExpenses = 0;
  let deliveryMinimumAdjustment = 0;

  if (input.delivery) {
    assertFinite(input.delivery.roundTripMiles, "input.delivery.roundTripMiles", { allowZero: true });
    assertFinite(input.delivery.setupHours, "input.delivery.setupHours", { allowZero: true });
    assertFinite(input.delivery.tollsParking ?? 0, "input.delivery.tollsParking", { allowZero: true });

    deliveryLabor = roundMoney(input.delivery.setupHours * profile.ownerHourlyRate);
    const mileageCost = roundMoney(input.delivery.roundTripMiles * profile.delivery.mileageRate);
    const tollsParking = roundMoney(input.delivery.tollsParking ?? 0);
    deliveryExpenses = roundMoney(mileageCost + tollsParking);
    const rawDeliveryCost = roundMoney(deliveryLabor + deliveryExpenses);
    deliveryMinimumAdjustment = roundMoney(
      Math.max((profile.delivery.minimumCharge ?? 0) - rawDeliveryCost, 0),
    );
    delivery = {
      appliedCost: roundMoney(rawDeliveryCost + deliveryMinimumAdjustment),
      laborCost: deliveryLabor,
      mileageCost,
      minimumAdjustment: deliveryMinimumAdjustment,
      roundTripMiles: input.delivery.roundTripMiles,
      setupHours: input.delivery.setupHours,
      tollsParking,
    };
  }

  const productionHours = sum(lines.map((line) => line.totalHours));
  const labor = roundMoney(productionHours * profile.ownerHourlyRate + deliveryLabor);
  const materials = roundMoney(sum(lines.map((line) => line.materialAllowance)));
  const packaging = roundMoney(sum(lines.map((line) => line.packagingAllowance)));
  const specialCosts = roundMoney(
    sum(lines.flatMap((line) => line.specialCosts.map((cost) => cost.totalCost))),
  );
  const overheadBasis = roundMoney(labor + materials + packaging + specialCosts);
  const variableOverhead = roundMoney(overheadBasis * profile.variableOverheadRate);
  const preContingencyCost = roundMoney(
    overheadBasis + profile.fixedOverheadPerOrder + variableOverhead + deliveryExpenses + deliveryMinimumAdjustment,
  );
  const contingency = adjustmentAmount(input.contingency, preContingencyCost);
  const internalTotal = roundMoney(preContingencyCost + contingency);
  const suggestedPriceUnrounded = roundMoney(internalTotal / (1 - profile.targetMargin));
  const suggestedPrice = Math.round(suggestedPriceUnrounded);
  const rush = adjustmentAmount(input.rush, suggestedPrice);
  const preDiscountRecommendation = roundMoney(suggestedPrice + rush);
  const discount = adjustmentAmount(input.discount, preDiscountRecommendation);
  const recommendedPrice = Math.max(Math.round(preDiscountRecommendation - discount), 0);
  const finalPrice = input.finalPrice ?? recommendedPrice;
  assertFinite(finalPrice, "input.finalPrice", { allowZero: true });

  const taxRate = input.taxRate ?? profile.defaultTaxRate;
  const depositRate = input.depositRate ?? profile.defaultDepositRate;
  assertRate(taxRate, "input.taxRate", true);
  assertRate(depositRate, "input.depositRate", true);
  const tax = roundMoney(finalPrice * taxRate);
  const customerTotal = roundMoney(finalPrice + tax);
  const depositAmount = roundMoney(customerTotal * depositRate);
  const margin = finalPrice > 0 ? roundRate((finalPrice - internalTotal) / finalPrice) : null;
  const publicStartingTotal = roundMoney(sum(lines.map((line) => {
    const floor = profile.productPresets[line.productKey]?.publicStartingPrice ?? 0;
    return floor * line.quantity;
  })));

  if (finalPrice < internalTotal) {
    warnings.push({ code: "BELOW_COST", message: "The chosen price is below estimated internal cost." });
  }
  if (margin === null || margin < profile.minimumMargin) {
    warnings.push({
      code: "BELOW_MINIMUM_MARGIN",
      message: "The chosen price is below the configured minimum margin.",
    });
  }
  if (finalPrice < publicStartingTotal) {
    warnings.push({
      code: "BELOW_PUBLIC_STARTING_PRICE",
      message: "The chosen price is below the current public starting price.",
    });
  }

  const validityDays = input.validityDays ?? profile.defaultQuoteValidityDays;
  if (!Number.isInteger(validityDays) || validityDays < 0) {
    throw new Error("input.validityDays must be a nonnegative integer.");
  }
  const issuedOn = input.issuedOn ?? null;

  return {
    adjustments: { contingency, discount, rush, tax },
    costs: {
      contingency,
      deliveryExpenses,
      fixedOverhead: profile.fixedOverheadPerOrder,
      internalTotal,
      labor,
      materials,
      overheadBasis,
      packaging,
      specialCosts,
      variableOverhead,
    },
    delivery,
    lines,
    metadata: {
      issuedOn,
      validityDays,
      validThrough: issuedOn ? addDays(issuedOn, validityDays) : null,
    },
    pricing: {
      balanceDue: roundMoney(customerTotal - depositAmount),
      customerTotal,
      depositAmount,
      finalPrice,
      margin,
      publicStartingTotal,
      recommendedPrice,
      suggestedPrice,
      suggestedPriceUnrounded,
    },
    profile: {
      currency: profile.currency,
      profileId: profile.profileId,
      version: profile.version,
    },
    warnings,
  };
}
