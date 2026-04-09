const productInquiryCtaBySlug = {
  "custom-cakes": "Start Your Custom Cake Inquiry",
  "wedding-cakes": "Request Your Wedding Cake Quote",
  cupcakes: "Start Your Cupcake Order",
  "sugar-cookies": "Start Your Cookie Order",
  macarons: "Start Your Macaron Order",
  "diy-kits": "Start Your DIY Kit Order",
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
