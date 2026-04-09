import type { InquiryFeatureFlags } from "@/lib/inquiries/config";
import type { InquiryPricingBaseline, ProductPricingBaseline } from "@/lib/pricing";
import type { ProductType } from "@/types/domain";

export type InquiryCatalogItem = {
  id: string | null;
  productType: ProductType;
  name: string;
  slug: string;
  shortDescription: string;
  requiresConsultation: boolean;
  pricing: ProductPricingBaseline;
  startingAt: number;
};

export type StartOrderPageData = {
  catalog: InquiryCatalogItem[];
  featureFlags: InquiryFeatureFlags;
  pricingBaseline: InquiryPricingBaseline;
  deliveryRange: [number, number];
};

export type InquirySubmissionResponse = {
  inquiryId: string;
  referenceCode: string;
  uploadedAssetCount: number;
};
