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
  eventTime?: string;
  guestCount?: number;
  servingTarget?: number;
  venueName?: string;
  venueAddress?: string;
  fulfillmentMethod: FulfillmentMethod;
  budgetMin?: number;
  budgetMax?: number;
  deliveryWindow?: string;
  colorPalette?: string;
  dietaryNotes?: string;
  orderItems: InquiryProductItem[];
  inspirationFiles: Array<{
    path: string;
    url?: string;
    name: string;
  }>;
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
  category: ProductType | "celebration";
  alt: string;
  imageUrl?: string | null;
  placeholderKey: string;
};
