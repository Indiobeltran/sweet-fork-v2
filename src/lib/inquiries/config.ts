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
    value: "under-75",
    label: "Under $75",
    note: "Best for cupcakes, macarons, smaller cookie sets, and simpler sweet moments.",
  },
  {
    value: "75-150",
    label: "$75 to $150",
    note: "A strong range for smaller custom cakes and premium treat assortments.",
  },
  {
    value: "150-300",
    label: "$150 to $300",
    note: "Comfortable for tiered celebrations, fuller treat orders, and more custom finishes.",
  },
  {
    value: "300-500",
    label: "$300 to $500",
    note: "Ideal for wedding cakes, statement designs, and multi-item dessert plans.",
  },
  {
    value: "500-plus",
    label: "$500+",
    note: "Best for larger weddings, fuller dessert spreads, and added delivery coordination.",
  },
  {
    value: "not-sure",
    label: "Not sure yet",
    note: "Choose this if you want guidance before setting a final budget range.",
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
    shortDescription: "Custom cakes for birthdays, milestones, and celebrations, starting at $80.",
    requiresConsultation: false,
  },
  "wedding-cake": {
    name: "Wedding Cakes",
    slug: "wedding-cakes",
    shortDescription: "Wedding cakes starting at $300, usually with 4 to 6 weeks notice.",
    requiresConsultation: true,
  },
  cupcakes: {
    name: "Cupcakes",
    slug: "cupcakes",
    shortDescription: "Custom cupcakes for parties and events, starting at $36 per dozen.",
    requiresConsultation: false,
  },
  "sugar-cookies": {
    name: "Sugar Cookies",
    slug: "sugar-cookies",
    shortDescription: "Decorated sugar cookies for favors and dessert tables, starting at $48 per dozen.",
    requiresConsultation: false,
  },
  macarons: {
    name: "Macarons",
    slug: "macarons",
    shortDescription: "Custom macarons for gifting and dessert tables, starting at $30 per dozen.",
    requiresConsultation: false,
  },
  "diy-kit": {
    name: "DIY Kits",
    slug: "diy-kits",
    shortDescription: "DIY decorating kits for parties and gifting, starting at $25.",
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
  switch (value) {
    case "under-75":
      return "Under $75";
    case "75-150":
      return "$75 to $150";
    case "150-300":
      return "$150 to $300";
    case "300-500":
      return "$300 to $500";
    case "500-plus":
      return "$500+";
    case "not-sure":
      return "Not sure yet";
    case "under-150":
      return "Under $150";
    case "300-600":
      return "$300 to $600";
    case "600-1000":
      return "$600 to $1,000";
    case "1000-2000":
      return "$1,000 to $2,000";
    case "2000-plus":
      return "$2,000+";
    default:
      return value;
  }
}

export function getBudgetFlexibilityLabel(value: BudgetFlexibility) {
  return (
    budgetFlexibilityOptions.find((option) => option.value === value)?.label ?? value
  );
}

export function resolveBudgetRangeValues(value: BudgetRangeValue) {
  switch (value) {
    case "under-75":
      return { minimum: 0, maximum: 75 };
    case "75-150":
      return { minimum: 75, maximum: 150 };
    case "150-300":
      return { minimum: 150, maximum: 300 };
    case "300-500":
      return { minimum: 300, maximum: 500 };
    case "500-plus":
      return { minimum: 500, maximum: null };
    case "not-sure":
      return { minimum: 0, maximum: null };
    case "under-150":
      return { minimum: 0, maximum: 150 };
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
