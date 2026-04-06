import type {
  BudgetFlexibility,
  BudgetRangeValue,
  InquiryProductItem,
  ProductType,
} from "@/types/domain";

export const inquiryStepTitles = [
  "Event Details",
  "Select Your Items",
  "Item Details",
  "Style & Inspiration",
  "Contact & Review",
] as const;

export const eventTypeSuggestions = [
  "Birthday",
  "Wedding",
  "Baby shower",
  "Bridal shower",
  "Anniversary",
  "Corporate event",
  "Holiday gathering",
] as const;

export const budgetRangeOptions: Array<{
  value: BudgetRangeValue;
  label: string;
  note: string;
}> = [
  {
    value: "under-150",
    label: "Under $150",
    note: "Best for smaller dessert moments and simpler customizations.",
  },
  {
    value: "150-300",
    label: "$150 to $300",
    note: "A strong range for premium cupcakes, cookies, and smaller cakes.",
  },
  {
    value: "300-600",
    label: "$300 to $600",
    note: "Comfortable for multi-item celebrations and more custom finishes.",
  },
  {
    value: "600-1000",
    label: "$600 to $1,000",
    note: "Ideal for statement cakes, wedding desserts, and fuller spreads.",
  },
  {
    value: "1000-2000",
    label: "$1,000 to $2,000",
    note: "Fits larger weddings, dessert tables, and delivery coordination.",
  },
  {
    value: "2000-plus",
    label: "$2,000+",
    note: "For large-scale wedding dessert experiences and premium scope.",
  },
];

export const budgetFlexibilityOptions: Array<{
  value: BudgetFlexibility;
  label: string;
  note: string;
}> = [
  {
    value: "firm",
    label: "This is our ceiling",
    note: "We need the proposal to stay tightly within this range.",
  },
  {
    value: "moderate",
    label: "Some flexibility",
    note: "We can stretch a bit for the right design or service plan.",
  },
  {
    value: "open",
    label: "Open to guidance",
    note: "We want the best recommendation first and can adjust from there.",
  },
];

export const productPresentationByType: Record<
  ProductType,
  {
    name: string;
    slug: string;
    shortDescription: string;
    requiresConsultation: boolean;
  }
> = {
  "custom-cake": {
    name: "Custom Cakes",
    slug: "custom-cakes",
    shortDescription: "Boutique celebration cakes designed around guest count, palette, and event mood.",
    requiresConsultation: false,
  },
  "wedding-cake": {
    name: "Wedding Cakes",
    slug: "wedding-cakes",
    shortDescription: "Tiered wedding cakes with space for service planning, delivery, and companion desserts.",
    requiresConsultation: true,
  },
  cupcakes: {
    name: "Cupcakes",
    slug: "cupcakes",
    shortDescription: "Custom cupcake assortments that still feel polished, tailored, and celebration-ready.",
    requiresConsultation: false,
  },
  "sugar-cookies": {
    name: "Sugar Cookies",
    slug: "sugar-cookies",
    shortDescription: "Decorated sugar cookies for favors, place settings, gifting, and dessert displays.",
    requiresConsultation: false,
  },
  macarons: {
    name: "Macarons",
    slug: "macarons",
    shortDescription: "Macaron assortments for weddings, gifting, and modern dessert tables.",
    requiresConsultation: false,
  },
  "diy-kit": {
    name: "DIY Kits",
    slug: "diy-kits",
    shortDescription: "Interactive decorating kits with a premium, celebration-friendly presentation.",
    requiresConsultation: false,
  },
};

export const cakeShapeOptions = [
  { value: "round", label: "Round" },
  { value: "heart", label: "Heart" },
  { value: "sheet", label: "Sheet" },
  { value: "tiered", label: "Tiered" },
] as const;

export const icingStyleOptions = [
  { value: "buttercream", label: "Buttercream" },
  { value: "fondant", label: "Fondant" },
  { value: "textured", label: "Textured finish" },
  { value: "painted", label: "Painted details" },
  { value: "mixed", label: "Mixed finish" },
] as const;

export type InquiryFeatureFlags = {
  uploadsEnabled: boolean;
  linkFallbackEnabled: boolean;
  storageBucket: string;
};

export const defaultInquiryFeatureFlags: InquiryFeatureFlags = {
  uploadsEnabled: true,
  linkFallbackEnabled: true,
  storageBucket: "inspiration",
};

export function createDefaultInquiryItem(productType: ProductType): InquiryProductItem {
  return {
    productType,
    quantity: 1,
  };
}

export function getBudgetRangeLabel(value: BudgetRangeValue) {
  return budgetRangeOptions.find((option) => option.value === value)?.label ?? value;
}

export function getBudgetFlexibilityLabel(value: BudgetFlexibility) {
  return (
    budgetFlexibilityOptions.find((option) => option.value === value)?.label ?? value
  );
}

export function resolveBudgetRangeValues(value: BudgetRangeValue) {
  switch (value) {
    case "under-150":
      return { minimum: 0, maximum: 150 };
    case "150-300":
      return { minimum: 150, maximum: 300 };
    case "300-600":
      return { minimum: 300, maximum: 600 };
    case "600-1000":
      return { minimum: 600, maximum: 1000 };
    case "1000-2000":
      return { minimum: 1000, maximum: 2000 };
    case "2000-plus":
      return { minimum: 2000, maximum: null };
    default:
      return { minimum: 0, maximum: null };
  }
}
