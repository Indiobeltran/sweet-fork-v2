export const adminRoles = ["owner", "manager"] as const;
export type AdminRole = (typeof adminRoles)[number];

export const productTypes = [
  "custom-cake",
  "wedding-cake",
  "cupcakes",
  "sugar-cookies",
  "macarons",
  "diy-kit",
] as const;
export type ProductType = (typeof productTypes)[number];

export const inquiryStatuses = [
  "new",
  "reviewing",
  "quoted",
  "approved",
  "declined",
  "archived",
] as const;
export type InquiryStatus = (typeof inquiryStatuses)[number];

export const orderStatuses = [
  "draft",
  "quoted",
  "confirmed",
  "in-production",
  "fulfilled",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses = ["unpaid", "deposit-paid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type ContactPreference = "email" | "text" | "phone";
export type FulfillmentMethod = "pickup" | "delivery";
export const budgetRangeValues = [
  "under-150",
  "150-300",
  "300-600",
  "600-1000",
  "1000-2000",
  "2000-plus",
] as const;
export type BudgetRangeValue = (typeof budgetRangeValues)[number];

export const budgetFlexibilityValues = ["firm", "moderate", "open"] as const;
export type BudgetFlexibility = (typeof budgetFlexibilityValues)[number];

export type ProductDetailOption = {
  label: string;
  value: string;
};

export type InquiryProductItem = {
  productType: ProductType;
  quantity: number;
  servings?: number;
  flavorNotes?: string;
  designNotes?: string;
  inspirationNotes?: string;
  sizeLabel?: string;
  tiers?: number;
  shape?: "round" | "heart" | "sheet" | "tiered" | "mini" | "assorted";
  icingStyle?: "buttercream" | "fondant" | "textured" | "painted" | "mixed";
  cupcakeCount?: number;
  cookieCount?: number;
  macaronCount?: number;
  kitCount?: number;
  weddingServings?: number;
  topperText?: string;
  colorPalette?: string;
};

export type InquiryPayload = {
  eventType: string;
  eventDate: string;
  deliveryZip?: string;
  guestCount?: number;
  budgetRange: BudgetRangeValue;
  budgetFlexibility: BudgetFlexibility;
  fulfillmentMethod: FulfillmentMethod;
  colorPalette?: string;
  orderItems: InquiryProductItem[];
  inspirationLinks: string[];
  inspirationText?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  instagramHandle?: string;
  preferredContact: ContactPreference;
  howDidYouHear?: string;
  additionalNotes?: string;
};

export type PricingRange = {
  minimum: number;
  maximum: number;
};

export type InquiryEstimate = PricingRange & {
  summary: string[];
  lineItems: Array<{
    productType: ProductType;
    label: string;
    minimum: number;
    maximum: number;
  }>;
};

export type ProductPageContent = {
  slug: string;
  shortTitle: string;
  title: string;
  eyebrow: string;
  intro: string;
  heroStatement: string;
  detailBullets: string[];
  packages: Array<{
    title: string;
    description: string;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
};

export type GalleryItem = {
  id: string;
  title: string;
  category: string;
  alt: string;
  imageUrl?: string | null;
  placeholderKey: string;
};
