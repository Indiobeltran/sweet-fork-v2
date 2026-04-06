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
import { getInquiryFeatureFlagEnvOverrides, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
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
    uploadsEnabled:
      envOverrides.uploadEnabled ??
      settingFlags?.uploadsEnabled ??
      defaultInquiryFeatureFlags.uploadsEnabled,
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
    uploadsEnabled: parseBoolean(value.uploadsEnabled),
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
  let deliveryRange: [number, number] = [35, 85];

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
  const productMap = new Map(products.map((product) => [product.product_type, product]));

  return productTypes.map((productType) => {
    const product = productMap.get(productType);
    const fallback = productPresentationByType[productType];

    return {
      id: product?.id ?? null,
      productType,
      name: product?.name ?? fallback.name,
      slug: product?.slug ?? fallback.slug,
      shortDescription:
        product?.short_description ?? fallback.shortDescription,
      requiresConsultation:
        product?.requires_consultation ?? fallback.requiresConsultation,
      pricing: pricingBaseline[productType],
      startingAt: getStartingPrice(productType, pricingBaseline),
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
  if (!isSupabaseConfigured()) {
    return {
      catalog: buildFallbackCatalog(defaultPricingBaseline),
      featureFlags: mergeFeatureFlags(),
      pricingBaseline: defaultPricingBaseline,
      deliveryRange: [35, 85],
    };
  }

  const admin = createAdminClient();

  try {
    const [{ data: products }, { data: productPrices }, { data: inquiryFlags }] =
      await Promise.all([
        admin
          .from("products")
          .select(
            "display_order, id, is_active, name, product_type, requires_consultation, short_description, slug",
          )
          .eq("is_active", true)
          .order("display_order"),
        admin
          .from("product_prices")
          .select(
            "effective_from, effective_to, is_active, label, maximum_amount, minimum_amount, price_kind, product_id",
          )
          .eq("is_active", true),
        admin
          .from("site_settings")
          .select("value_json")
          .eq("setting_key", "inquiry.flags")
          .maybeSingle(),
      ]);

    const activeProducts =
      (products as ProductRow[] | null)?.filter((product) => product.is_active) ?? [];
    const activeProductPrices = (productPrices as ProductPriceRow[] | null) ?? [];
    const { pricingBaseline, deliveryRange } = buildPricingBaseline(
      activeProducts,
      activeProductPrices,
    );

    return {
      catalog:
        activeProducts.length > 0
          ? buildCatalog(activeProducts, pricingBaseline)
          : buildFallbackCatalog(pricingBaseline),
      featureFlags: parseFeatureFlags(inquiryFlags?.value_json ?? null),
      pricingBaseline,
      deliveryRange,
    };
  } catch (error) {
    console.error("Unable to load live start-order data.", error);

    return {
      catalog: buildFallbackCatalog(defaultPricingBaseline),
      featureFlags: mergeFeatureFlags(),
      pricingBaseline: defaultPricingBaseline,
      deliveryRange: [35, 85],
    };
  }
}

export function getProductName(
  catalogMap: Record<ProductType, InquiryCatalogItem>,
  productType: ProductType,
) {
  return catalogMap[productType]?.name ?? getProductDisplayLabel(productType);
}
