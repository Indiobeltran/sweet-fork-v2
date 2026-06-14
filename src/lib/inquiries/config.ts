import type {
  BudgetFlexibility,
  BudgetRangeValue,
  InquiryProductItem,
  ProductType,
} from "@/types/domain";

export const inquiryStepTitles = [
  "Event Details",
  "Select Desserts",
  "Customize Items",
  "Style & Inspiration",
  "Review & Submit",
] as const;

export const inquiryStepDescriptions = [
  "Confirm the event type, date, fulfillment plan, and budget range.",
  "Choose the desserts you would like included in your quote.",
  "Add serving counts, flavors, and design notes for each dessert.",
  "Share color direction, inspiration images, links, or written notes.",
  "Review the full inquiry, add contact details, and send it through.",
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
    note: "Smaller dessert orders and simpler celebrations.",
  },
  {
    value: "150-300",
    label: "$150 to $300",
    note: "Smaller custom cakes and dessert assortments.",
  },
  {
    value: "300-600",
    label: "$300 to $600",
    note: "Larger cakes, wedding work, and dessert tables.",
  },
  {
    value: "600-1000",
    label: "$600 to $1,000",
    note: "Fuller dessert spreads and statement cakes.",
  },
  {
    value: "1000-2000",
    label: "$1,000 to $2,000",
    note: "Larger weddings and higher guest counts.",
  },
  {
    value: "2000-plus",
    label: "$2,000+",
    note: "High-capacity wedding and event orders.",
  },
  {
    value: "not-sure",
    label: "Not sure yet",
    note: "We'll help you narrow it down — no pressure.",
  },
];

export const budgetFlexibilityOptions: Array<{
  value: BudgetFlexibility;
  label: string;
  note: string;
}> = [
  {
    value: "firm",
    label: "This is our comfort zone",
    note: "We would like the proposal to stay close to this range.",
  },
  {
    value: "moderate",
    label: "Some flexibility",
    note: "We can stretch a little for the right design direction or service plan.",
  },
  {
    value: "open",
    label: "Open to guidance",
    note: "We would rather see the best recommendation first and adjust from there.",
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
    shortDescription: "Celebration cakes designed around your event, guest count, and visual style.",
    requiresConsultation: false,
  },
  "wedding-cake": {
    name: "Wedding Cakes",
    slug: "wedding-cakes",
    shortDescription: "Elegant centerpiece cakes with room to coordinate companion desserts.",
    requiresConsultation: true,
  },
  cupcakes: {
    name: "Cupcakes",
    slug: "cupcakes",
    shortDescription: "Custom cupcakes for dessert tables, gifting, and easy-to-serve celebrations.",
    requiresConsultation: false,
  },
  "sugar-cookies": {
    name: "Sugar Cookies",
    slug: "sugar-cookies",
    shortDescription: "Decorated sugar cookies for favors, gift sets, and elevated table details.",
    requiresConsultation: false,
  },
  macarons: {
    name: "Macarons",
    slug: "macarons",
    shortDescription: "Handcrafted macarons for gifting, weddings, and curated dessert styling.",
    requiresConsultation: false,
  },
  "diy-kit": {
    name: "DIY Kits",
    slug: "diy-kits",
    shortDescription: "Decorating kits for parties, gifting, and hosted sweet-at-home activities.",
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
  linkFallbackEnabled: boolean;
  storageBucket: string;
};

export const defaultInquiryFeatureFlags: InquiryFeatureFlags = {
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
    case "under-150":
      return "Under $150";
    case "150-300":
      return "$150 to $300";
    case "300-600":
      return "$300 to $600";
    case "600-1000":
      return "$600 to $1,000";
    case "1000-2000":
      return "$1,000 to $2,000";
    case "2000-plus":
      return "$2,000+";
    case "not-sure":
      return "Not sure yet";
    case "under-75":
      return "Under $75";
    case "75-150":
      return "$75 to $150";
    case "300-500":
      return "$300 to $500";
    case "500-plus":
      return "$500+";
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
    case "not-sure":
      return { minimum: 0, maximum: null };
    case "under-75":
      return { minimum: 0, maximum: 75 };
    case "75-150":
      return { minimum: 75, maximum: 150 };
    case "300-500":
      return { minimum: 300, maximum: 500 };
    case "500-plus":
      return { minimum: 500, maximum: null };
    default:
      return { minimum: 0, maximum: null };
  }
}
