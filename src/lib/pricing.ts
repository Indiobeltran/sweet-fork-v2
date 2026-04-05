import type { InquiryEstimate, InquiryPayload, InquiryProductItem, ProductType } from "@/types/domain";

const pricingTable: Record<
  ProductType,
  {
    base: [number, number];
    perServing?: [number, number];
    perUnit?: [number, number];
  }
> = {
  "custom-cake": {
    base: [160, 260],
    perServing: [6, 10],
  },
  "wedding-cake": {
    base: [450, 850],
    perServing: [7, 12],
  },
  cupcakes: {
    base: [72, 96],
    perUnit: [3.5, 5],
  },
  "sugar-cookies": {
    base: [85, 115],
    perUnit: [4.25, 6],
  },
  macarons: {
    base: [70, 98],
    perUnit: [3.25, 4.75],
  },
  "diy-kit": {
    base: [48, 70],
    perUnit: [12, 18],
  },
};

function resolveQuantity(item: InquiryProductItem) {
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

function getItemLabel(item: InquiryProductItem) {
  switch (item.productType) {
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
      return item.productType;
  }
}

export function estimateItemRange(item: InquiryProductItem) {
  const pricing = pricingTable[item.productType];
  const quantity = resolveQuantity(item);
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

  return {
    label: getItemLabel(item),
    minimum: Math.round(minimum),
    maximum: Math.round(maximum),
  };
}

export function estimateInquiry(payload: InquiryPayload): InquiryEstimate {
  const lineItems = payload.orderItems.map(estimateItemRange);
  const totals = lineItems.reduce(
    (acc, item) => {
      acc.minimum += item.minimum;
      acc.maximum += item.maximum;
      return acc;
    },
    { minimum: 0, maximum: 0 },
  );

  if (payload.fulfillmentMethod === "delivery") {
    totals.minimum += 35;
    totals.maximum += 85;
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

export function getStartingPrice(productType: ProductType) {
  return pricingTable[productType].base[0];
}
