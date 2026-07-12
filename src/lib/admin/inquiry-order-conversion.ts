type QuoteLineForConversion = {
  id: string;
  materialAllowance: number;
  packagingAllowance: number;
  productKey: string;
  quantity: number;
  specialCosts: Array<{ totalCost: number }>;
  stageHours: Record<string, number>;
};

type QuoteSnapshotForConversion = {
  calculation: {
    adjustments: { tax: number };
    lines: QuoteLineForConversion[];
    pricing: {
      customerTotal: number;
      depositAmount: number;
      finalPrice: number;
      recommendedPrice: number;
    };
  };
  profile: {
    ownerHourlyRate: number;
  };
};

type FinalizedQuoteForConversion = {
  customerScope: string | null;
  id: string;
  snapshot: QuoteSnapshotForConversion;
  version: number;
};

type InquiryItemForConversion = {
  id: string;
  productType: string;
  quantity: number;
};

type ManualConversionValues = {
  depositDueAmount: number;
  estimatedTotalAmount: number | null;
  internalSummary: string | null;
  totalAmount: number;
};

type StoredItemCounts = {
  cookieCount: number | null;
  cupcakeCount: number | null;
  kitCount: number | null;
  macaronCount: number | null;
};

export function reconcileQuoteBackedItemCounts(
  productType: string,
  quoteQuantity: number,
  storedCounts: StoredItemCounts,
): StoredItemCounts {
  if (!Number.isInteger(quoteQuantity) || quoteQuantity <= 0) {
    throw new Error("Quote item quantity must be a positive whole number.");
  }

  switch (productType) {
    case "cupcakes":
      return { ...storedCounts, cupcakeCount: quoteQuantity * 12 };
    case "sugar-cookies":
      return { ...storedCounts, cookieCount: quoteQuantity * 12 };
    case "macarons":
      return { ...storedCounts, macaronCount: quoteQuantity * 12 };
    case "diy-kit":
      return { ...storedCounts, kitCount: quoteQuantity };
    default:
      return storedCounts;
  }
}

export type InquiryOrderConversion = {
  balanceDueAmount: number;
  depositDueAmount: number;
  estimatedTotalAmount: number | null;
  internalSummary: string | null;
  linePricing: Array<{
    inquiryItemId: string;
    lineTotal: number;
    quantity: number;
    unitPrice: number | null;
  }> | null;
  quoteMetadata: {
    inquiryQuoteId: string;
    inquiryQuoteVersion: number;
  } | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
};

function toCents(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative finite amount.`);
  }

  return Math.round((value + Number.EPSILON) * 100);
}

function fromCents(value: number) {
  return value / 100;
}

function roundMoney(value: number) {
  return fromCents(toCents(value, "Money value"));
}

function quoteLineWeight(line: QuoteLineForConversion, ownerHourlyRate: number) {
  const hours = Object.values(line.stageHours).reduce((sum, value) => sum + value, 0);
  const specialCosts = line.specialCosts.reduce((sum, value) => sum + value.totalCost, 0);
  const weight =
    hours * ownerHourlyRate +
    line.materialAllowance +
    line.packagingAllowance +
    specialCosts;

  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

function allocatePreTaxTotal(
  totalAmount: number,
  quoteLines: QuoteLineForConversion[],
  inquiryItems: InquiryItemForConversion[],
  ownerHourlyRate: number,
) {
  const quoteLineById = new Map<string, QuoteLineForConversion>();

  quoteLines.forEach((line) => {
    if (quoteLineById.has(line.id)) {
      throw new Error("Finalized quote lines must match the inquiry items exactly.");
    }
    quoteLineById.set(line.id, line);
  });

  const itemIds = new Set(inquiryItems.map((item) => item.id));
  if (
    itemIds.size !== inquiryItems.length ||
    quoteLineById.size !== inquiryItems.length ||
    inquiryItems.some((item) => !quoteLineById.has(item.id))
  ) {
    throw new Error("Finalized quote lines must match the inquiry items exactly.");
  }

  const weightedItems = inquiryItems.map((item) => {
    const line = quoteLineById.get(item.id)!;
    if (line.productKey !== item.productType) {
      throw new Error("Finalized quote lines must match the inquiry items exactly.");
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("Finalized quote line quantities must be positive whole numbers.");
    }

    return {
      id: item.id,
      quantity: line.quantity,
      weight: quoteLineWeight(line, ownerHourlyRate),
    };
  });
  const allocationWeights = weightedItems.map((item) => ({
    ...item,
    weight: item.weight > 0 ? item.weight : item.quantity,
  }));
  const totalWeight = allocationWeights.reduce((sum, item) => sum + item.weight, 0);
  const totalCents = toCents(totalAmount, "Quote pre-tax total");
  const allocations = allocationWeights.map((item) => {
    const rawShare = totalWeight > 0 ? (totalCents * item.weight) / totalWeight : 0;
    const cents = Math.floor(rawShare);
    return {
      ...item,
      cents,
      remainder: rawShare - cents,
    };
  });
  const remainingCents = totalCents - allocations.reduce((sum, item) => sum + item.cents, 0);

  const remainderOrder = [...allocations].sort(
    (left, right) => right.remainder - left.remainder || left.id.localeCompare(right.id),
  );
  for (let index = 0; index < remainingCents; index += 1) {
    remainderOrder[index % remainderOrder.length].cents += 1;
  }

  const allocationById = new Map(allocations.map((item) => [item.id, item]));
  return inquiryItems.map((item) => {
    const allocation = allocationById.get(item.id)!;
    const lineTotal = fromCents(allocation.cents);
    return {
      inquiryItemId: item.id,
      lineTotal,
      quantity: allocation.quantity,
      unitPrice:
        allocation.cents % allocation.quantity === 0
          ? fromCents(allocation.cents / allocation.quantity)
          : null,
    };
  });
}

export function resolveInquiryOrderConversion({
  finalizedQuote,
  inquiryItems,
  manualValues,
}: {
  finalizedQuote: FinalizedQuoteForConversion | null;
  inquiryItems: InquiryItemForConversion[];
  manualValues: ManualConversionValues;
}): InquiryOrderConversion {
  if (!finalizedQuote) {
    const totalCents = toCents(manualValues.totalAmount, "Manual order total");
    const depositCents = toCents(manualValues.depositDueAmount, "Manual deposit");
    if (depositCents > totalCents) {
      throw new Error("Manual deposit cannot exceed the order total.");
    }

    return {
      balanceDueAmount: manualValues.totalAmount,
      depositDueAmount: manualValues.depositDueAmount,
      estimatedTotalAmount: manualValues.estimatedTotalAmount,
      internalSummary: manualValues.internalSummary,
      linePricing: null,
      quoteMetadata: null,
      subtotalAmount: manualValues.totalAmount,
      taxAmount: 0,
      totalAmount: manualValues.totalAmount,
    };
  }

  const { calculation } = finalizedQuote.snapshot;
  const subtotalAmount = fromCents(toCents(calculation.pricing.finalPrice, "Quote pre-tax total"));
  const taxAmount = fromCents(toCents(calculation.adjustments.tax, "Quote tax"));
  const totalAmount = fromCents(toCents(calculation.pricing.customerTotal, "Quote total"));
  const depositDueAmount = fromCents(
    toCents(calculation.pricing.depositAmount, "Quote deposit"),
  );

  if (
    toCents(subtotalAmount, "Quote pre-tax total") + toCents(taxAmount, "Quote tax") !==
    toCents(totalAmount, "Quote total")
  ) {
    throw new Error("Finalized quote totals are inconsistent.");
  }

  return {
    balanceDueAmount: totalAmount,
    depositDueAmount,
    estimatedTotalAmount: roundMoney(calculation.pricing.recommendedPrice),
    internalSummary: finalizedQuote.customerScope?.trim() || null,
    linePricing: allocatePreTaxTotal(
      subtotalAmount,
      calculation.lines,
      inquiryItems,
      finalizedQuote.snapshot.profile.ownerHourlyRate,
    ),
    quoteMetadata: {
      inquiryQuoteId: finalizedQuote.id,
      inquiryQuoteVersion: finalizedQuote.version,
    },
    subtotalAmount,
    taxAmount,
    totalAmount,
  };
}
