import "server-only";

import {
  defaultInquiryFeatureFlags,
  productPresentationByType,
  type InquiryFeatureFlags,
} from "@/lib/inquiries/config";
import {
  defaultPricingBaseline,
  getProductDisplayLabel,
  getStartingPrice,
  type InquiryPricingBaseline,
} from "@/lib/pricing";
import type { InquiryCatalogItem, StartOrderPageData } from "@/lib/inquiries/types";
import {
  getInquiryFeatureFlagEnvOverrides,
  isSupabaseBrowserConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { createPublicDataClient } from "@/lib/supabase/public";
import { productTypes, type ProductType } from "@/types/domain";
import type { Json, Tables } from "@/types/supabase.generated";

type ProductRow = Pick<
  Tables<"products">,
  "display_order" | "id" | "is_active" | "name" | "product_type" | "requires_consultation" | "short_description" | "slug"
>;

type ProductPriceRow = Pick<
  Tables<"product_prices">,
  | "effective_from"
  | "effective_to"
  | "is_active"
  | "label"
  | "maximum_amount"
  | "minimum_amount"
  | "price_kind"
  | "product_id"
>;

function isRecord(value: Json | null): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseBoolean(value: Json | undefined) {
  return typeof value === "boolean" ? value : undefined;
}

function parseString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function mergeFeatureFlags(settingFlags?: Partial<InquiryFeatureFlags>) {
  const envOverrides = getInquiryFeatureFlagEnvOverrides();

  return {
    linkFallbackEnabled:
      envOverrides.linkFallbackEnabled ??
      settingFlags?.linkFallbackEnabled ??
      defaultInquiryFeatureFlags.linkFallbackEnabled,
    storageBucket:
      envOverrides.storageBucket ??
      settingFlags?.storageBucket ??
      defaultInquiryFeatureFlags.storageBucket,
  } satisfies InquiryFeatureFlags;
}

function parseFeatureFlags(value: Json | null) {
  if (!isRecord(value)) {
    return mergeFeatureFlags();
  }

  return mergeFeatureFlags({
    linkFallbackEnabled: parseBoolean(value.linkFallbackEnabled),
    storageBucket: parseString(value.storageBucket),
  });
}

function isCurrentPriceRow(row: ProductPriceRow) {
  if (!row.is_active) {
    return false;
  }

  const today = new Date();
  const startsOn = new Date(row.effective_from);
  const endsOn = row.effective_to ? new Date(row.effective_to) : null;

  if (Number.isNaN(startsOn.getTime())) {
    return false;
  }

  return startsOn <= today && (!endsOn || endsOn >= today);
}

function pickLatestPriceRows(priceRows: ProductPriceRow[]) {
  const latestByKey = new Map<string, ProductPriceRow>();

  priceRows
    .filter(isCurrentPriceRow)
    .sort((left, right) => right.effective_from.localeCompare(left.effective_from))
    .forEach((row) => {
      const key = `${row.product_id}:${row.price_kind}`;
      if (!latestByKey.has(key)) {
        latestByKey.set(key, row);
      }
    });

  return latestByKey;
}

function buildPricingBaseline(
  products: ProductRow[],
  productPrices: ProductPriceRow[],
): {
  pricingBaseline: InquiryPricingBaseline;
  deliveryRange: [number, number];
} {
  const pricingBaseline: InquiryPricingBaseline = {
    ...defaultPricingBaseline,
  };
  const latestByKey = pickLatestPriceRows(productPrices);
  let deliveryRange: [number, number] = [15, 50];

  products.forEach((product) => {
    const productType = product.product_type;
    const current = { ...pricingBaseline[productType] };

    const baseRow =
      latestByKey.get(`${product.id}:base`) ??
      latestByKey.get(`${product.id}:starting`);
    const perServingRow = latestByKey.get(`${product.id}:per-serving`);
    const perUnitRow = latestByKey.get(`${product.id}:per-unit`);
    const deliveryRow = latestByKey.get(`${product.id}:delivery-add-on`);

    if (baseRow) {
      current.base = [
        Math.round(baseRow.minimum_amount),
        Math.round(baseRow.maximum_amount ?? baseRow.minimum_amount),
      ];
    }

    if (perServingRow) {
      current.perServing = [
        Math.round(perServingRow.minimum_amount),
        Math.round(perServingRow.maximum_amount ?? perServingRow.minimum_amount),
      ];
    }

    if (perUnitRow) {
      current.perUnit = [
        Math.round(perUnitRow.minimum_amount),
        Math.round(perUnitRow.maximum_amount ?? perUnitRow.minimum_amount),
      ];
    }

    if (deliveryRow) {
      deliveryRange = [
        Math.round(deliveryRow.minimum_amount),
        Math.round(deliveryRow.maximum_amount ?? deliveryRow.minimum_amount),
      ];
    }

    pricingBaseline[productType] = current;
  });

  return {
    pricingBaseline,
    deliveryRange,
  };
}

function buildFallbackCatalog(pricingBaseline: InquiryPricingBaseline): InquiryCatalogItem[] {
  return productTypes.map((productType) => {
    const fallback = productPresentationByType[productType];

    return {
      id: null,
      productType,
      name: fallback.name,
      slug: fallback.slug,
      shortDescription: fallback.shortDescription,
      requiresConsultation: fallback.requiresConsultation,
      pricing: pricingBaseline[productType],
      startingAt: getStartingPrice(productType, pricingBaseline),
    };
  });
}

function buildCatalog(
  products: ProductRow[],
  pricingBaseline: InquiryPricingBaseline,
): InquiryCatalogItem[] {
  return products
    .slice()
    .sort((left, right) => left.display_order - right.display_order)
    .map((product) => {
      const fallback = productPresentationByType[product.product_type];

      return {
        id: product.id,
        productType: product.product_type,
        name: product.name,
        slug: product.slug,
        shortDescription: fallback.shortDescription,
        requiresConsultation: product.requires_consultation ?? fallback.requiresConsultation,
        pricing: pricingBaseline[product.product_type],
        startingAt: getStartingPrice(product.product_type, pricingBaseline),
      };
    });
}

export function getCatalogMap(catalog: InquiryCatalogItem[]) {
  return catalog.reduce(
    (accumulator, item) => {
      accumulator[item.productType] = item;
      return accumulator;
    },
    {} as Record<ProductType, InquiryCatalogItem>,
  );
}

export async function getStartOrderPageData(): Promise<StartOrderPageData> {
  const submissionAvailable = isSupabaseConfigured();

  if (!isSupabaseBrowserConfigured()) {
    return {
      catalog: buildFallbackCatalog(defaultPricingBaseline),
      catalogSource: "fallback",
      submissionAvailable: false,
      submissionUnavailableMessage:
        "Online submission is temporarily unavailable, but you can still prepare your inquiry details and send them by email.",
      featureFlags: mergeFeatureFlags(),
      pricingBaseline: defaultPricingBaseline,
      deliveryRange: [15, 50],
    };
  }

  const supabase = createPublicDataClient();

  try {
    const [productsResult, productPricesResult, inquiryFlagsResult] =
      await Promise.all([
        supabase
          .from("products")
          .select(
            "display_order, id, is_active, name, product_type, requires_consultation, short_description, slug",
          )
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("product_prices")
          .select(
            "effective_from, effective_to, is_active, label, maximum_amount, minimum_amount, price_kind, product_id",
          )
          .eq("is_active", true),
        supabase
          .from("site_settings")
          .select("value_json")
          .eq("setting_key", "inquiry.flags")
          .maybeSingle(),
      ]);
    const queryError =
      productsResult.error ?? productPricesResult.error ?? inquiryFlagsResult.error;

    if (queryError) {
      throw new Error(queryError.message);
    }

    const activeProducts =
      (productsResult.data as ProductRow[] | null)?.filter((product) => product.is_active) ?? [];
    const activeProductPrices = (productPricesResult.data as ProductPriceRow[] | null) ?? [];
    const { pricingBaseline, deliveryRange } = buildPricingBaseline(
      activeProducts,
      activeProductPrices,
    );
    const catalog =
      activeProducts.length > 0
        ? buildCatalog(activeProducts, pricingBaseline)
        : buildFallbackCatalog(pricingBaseline);

    return {
      catalog,
      catalogSource: activeProducts.length > 0 ? "live" : "fallback",
      submissionAvailable,
      submissionUnavailableMessage: submissionAvailable
        ? undefined
        : "Online submission is temporarily unavailable, but you can still prepare your inquiry details and send them by email.",
      featureFlags: parseFeatureFlags(inquiryFlagsResult.data?.value_json ?? null),
      pricingBaseline,
      deliveryRange,
    };
  } catch (error) {
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      console.warn("Unable to load live start-order data.", {
        message: error instanceof Error ? error.message : "Unknown Supabase catalog error",
      });
    }

    return {
      catalog: buildFallbackCatalog(defaultPricingBaseline),
      catalogSource: "fallback",
      submissionAvailable: false,
      submissionUnavailableMessage:
        "Online submission is temporarily unavailable, but you can still prepare your inquiry details and send them by email.",
      featureFlags: mergeFeatureFlags(),
      pricingBaseline: defaultPricingBaseline,
      deliveryRange: [15, 50],
    };
  }
}

export function getProductName(
  catalogMap: Record<ProductType, InquiryCatalogItem>,
  productType: ProductType,
) {
  return catalogMap[productType]?.name ?? getProductDisplayLabel(productType);
}
