const productInquiryCtaBySlug = {
  "custom-cakes": "Plan Your Custom Cake",
  "wedding-cakes": "Start a Wedding Cake Inquiry",
  cupcakes: "Plan Your Custom Cupcakes",
  "sugar-cookies": "Plan Your Custom Cookie Set",
  macarons: "Inquire About Macarons",
  "diy-kits": "Inquire About DIY Kits",
} as const;

export type ProductInquirySlug = keyof typeof productInquiryCtaBySlug;

export const defaultInquiryCta = {
  href: "/start-order",
  label: "Start Your Inquiry",
  subtext: "Share your date and celebration details",
} as const;

export function isProductInquirySlug(value: string): value is ProductInquirySlug {
  return value in productInquiryCtaBySlug;
}

export function getInquiryCtaBySlug(slug?: string) {
  if (!slug || !isProductInquirySlug(slug)) {
    return defaultInquiryCta;
  }

  return {
    href: "/start-order",
    label: productInquiryCtaBySlug[slug],
    subtext: defaultInquiryCta.subtext,
  } as const;
}
