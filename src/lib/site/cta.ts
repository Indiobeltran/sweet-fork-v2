const productInquiryCtaBySlug = {
  "custom-cakes": "Start Designing Your Cake",
  "wedding-cakes": "Begin Your Wedding Cake Vision",
  cupcakes: "Build Your Cupcake Box",
  "sugar-cookies": "Plan Your Custom Cookie Set",
  macarons: "Create Your Macaron Assortment",
  "diy-kits": "Plan Your DIY Cookie Kit",
} as const;

export type ProductInquirySlug = keyof typeof productInquiryCtaBySlug;

export const defaultInquiryCta = {
  href: "/start-order",
  label: "Start Your Inquiry",
  subtext: "Takes 2–3 minutes • No commitment required",
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
