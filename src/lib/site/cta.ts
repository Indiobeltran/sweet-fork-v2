const productInquiryCtaBySlug = {
  "custom-cakes": "Request a Quote",
  "wedding-cakes": "Request a Quote",
  cupcakes: "Request a Quote",
  "sugar-cookies": "Request a Quote",
  macarons: "Request a Quote",
  "diy-kits": "Request a Quote",
} as const;

export type ProductInquirySlug = keyof typeof productInquiryCtaBySlug;

export const defaultInquiryCta = {
  href: "/start-order",
  label: "Request a Quote",
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
