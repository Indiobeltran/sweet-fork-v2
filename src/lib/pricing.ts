import type { InquiryEstimate, InquiryPayload, InquiryProductItem, ProductType } from "@/types/domain";

export type ProductPricingBaseline = {
  base: [number, number];
  perServing?: [number, number];
  perUnit?: [number, number];
};

export type InquiryPricingBaseline = Record<ProductType, ProductPricingBaseline>;

export const defaultPricingBaseline: InquiryPricingBaseline = {
  "custom-cake": {
    base: [80, 120],
    perServing: [0, 3],
  },
  "wedding-cake": {
    base: [300, 450],
    perServing: [0, 5],
  },
  cupcakes: {
    base: [36, 48],
    perUnit: [0, 1.5],
  },
  "sugar-cookies": {
    base: [48, 60],
    perUnit: [0, 1.5],
  },
  macarons: {
    base: [30, 42],
    perUnit: [0, 1.25],
  },
  "diy-kit": {
    base: [25, 35],
    perUnit: [0, 5],
  },
};

export function getProductDisplayLabel(productType: ProductType) {
  switch (productType) {
    case "custom-cake":
      return "Custom cake";
    case "wedding-cake":
      return "Wedding cake";
    case "cupcakes":
      return "Cupcakes";
    case "sugar-cookies":
      return "Sugar cookies";
    case "macarons":
      return "Macarons";
    case "diy-kit":
      return "DIY kit";
    default:
      return productType;
  }
}

export function getStoredItemQuantity(item: InquiryProductItem) {
  switch (item.productType) {
    case "custom-cake":
      return item.quantity;
    case "wedding-cake":
      return item.quantity;
    case "cupcakes":
      return Math.max(1, Math.ceil((item.cupcakeCount ?? item.quantity * 12) / 12));
    case "sugar-cookies":
      return Math.max(1, Math.ceil((item.cookieCount ?? item.quantity * 12) / 12));
    case "macarons":
      return Math.max(1, Math.ceil((item.macaronCount ?? item.quantity * 12) / 12));
    case "diy-kit":
      return item.kitCount ?? item.quantity;
    default:
      return item.quantity;
  }
}

function resolveEstimateQuantity(item: InquiryProductItem) {
  switch (item.productType) {
    case "custom-cake":
      return item.servings ?? item.quantity * 18;
    case "wedding-cake":
      return item.weddingServings ?? item.servings ?? item.quantity * 40;
    case "cupcakes":
      return item.cupcakeCount ?? item.quantity * 12;
    case "sugar-cookies":
      return item.cookieCount ?? item.quantity * 12;
    case "macarons":
      return item.macaronCount ?? item.quantity * 12;
    case "diy-kit":
      return item.kitCount ?? item.quantity;
    default:
      return item.quantity;
  }
}

type EstimateOptions = {
  pricing?: InquiryPricingBaseline;
  deliveryRange?: [number, number];
};

export function estimateItemRange(
  item: InquiryProductItem,
  pricingBaseline: InquiryPricingBaseline = defaultPricingBaseline,
) {
  const pricing = pricingBaseline[item.productType];
  const quantity = resolveEstimateQuantity(item);
  const [baseMin, baseMax] = pricing.base;

  const unitRange = pricing.perServing ?? pricing.perUnit ?? [0, 0];
  const [unitMin, unitMax] = unitRange;

  let minimum = baseMin + quantity * unitMin;
  let maximum = baseMax + quantity * unitMax;

  if (item.icingStyle === "painted" || item.icingStyle === "mixed") {
    minimum += 40;
    maximum += 110;
  }

  if (item.tiers && item.tiers > 1) {
    minimum += item.tiers * 55;
    maximum += item.tiers * 135;
  }

  if (
    item.productType === "custom-cake" &&
    (item.shape === "heart" || item.shape === "tiered")
  ) {
    minimum += 35;
    maximum += 85;
  }

  if (item.topperText) {
    minimum += 12;
    maximum += 32;
  }

  return {
    productType: item.productType,
    label: getProductDisplayLabel(item.productType),
    minimum: Math.round(minimum),
    maximum: Math.round(maximum),
  };
}

export function estimateInquiry(
  payload: InquiryPayload,
  options: EstimateOptions = {},
): InquiryEstimate {
  const pricingBaseline = options.pricing ?? defaultPricingBaseline;
  const deliveryRange = options.deliveryRange ?? [15, 50];
  const lineItems = payload.orderItems.map((item) => estimateItemRange(item, pricingBaseline));
  const totals = lineItems.reduce(
    (acc, item) => {
      acc.minimum += item.minimum;
      acc.maximum += item.maximum;
      return acc;
    },
    { minimum: 0, maximum: 0 },
  );

  if (payload.fulfillmentMethod === "delivery") {
    totals.minimum += deliveryRange[0];
    totals.maximum += deliveryRange[1];
  }

  const summary = [
    `${payload.orderItems.length} product selection${payload.orderItems.length === 1 ? "" : "s"} for a ${payload.eventType.toLowerCase()} celebration`,
    payload.eventDate ? `Event date: ${payload.eventDate}` : "Date to be confirmed",
    payload.fulfillmentMethod === "delivery"
      ? "Delivery requested"
      : "Pickup requested",
  ];

  return {
    ...totals,
    lineItems,
    summary,
  };
}

export function getStartingPrice(
  productType: ProductType,
  pricingBaseline: InquiryPricingBaseline = defaultPricingBaseline,
) {
  return pricingBaseline[productType].base[0];
}
