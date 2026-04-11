import "server-only";

import {
  getManagedContentSections,
  mediaPlacementDefinitions,
  type ManagedContentSection,
} from "@/lib/site/marketing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { defaultPricingBaseline } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type { Json, Tables } from "@/types/supabase.generated";

type MediaAssetRow = Tables<"media_assets">;
type MediaAssignmentRow = Tables<"media_assignments">;
type GalleryCategoryRow = Tables<"gallery_categories">;
type FaqRow = Tables<"faq_items">;
type TestimonialRow = Tables<"testimonials">;
type ProductRow = Tables<"products">;
type ProductPriceRow = Tables<"product_prices">;

export type MediaLibraryAsset = {
  altText: string;
  caption: string;
  categoryAssignments: Array<{
    categoryId: string;
    displayOrder: number;
  }>;
  createdAt: string;
  featured: boolean;
  filename: string;
  id: string;
  pageAssignments: Array<{
    displayOrder: number;
    placementKey: string;
  }>;
  previewUrl: string | null;
};

export type MediaLibraryData = {
  assets: MediaLibraryAsset[];
  categories: GalleryCategoryRow[];
};

export type PricingEditorProduct = {
  displayOrder: number;
  id: string;
  isActive: boolean;
  name: string;
  productType: ProductRow["product_type"];
  prices: Array<{
    id: string | null;
    isActive: boolean;
    kind: ProductPriceRow["price_kind"];
    label: string;
    maximumAmount: number | null;
    minimumAmount: number;
    notes: string | null;
    unitLabel: string | null;
  }>;
  requiresConsultation: boolean;
  startingAtLabel: string;
};

function isRecord(value: Json | null): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getBooleanValue(record: Record<string, Json> | null, key: string) {
  if (!record) {
    return null;
  }

  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

async function getMediaPreviewUrl(
  admin: ReturnType<typeof createAdminClient>,
  asset: Pick<MediaAssetRow, "bucket" | "public_url" | "storage_path">,
) {
  if (asset.bucket && asset.storage_path) {
    const { data } = await admin.storage.from(asset.bucket).createSignedUrl(asset.storage_path, 60 * 60);

    if (data?.signedUrl) {
      return data.signedUrl;
    }
  }

  if (asset.public_url) {
    return asset.public_url;
  }

  if (!asset.bucket || !asset.storage_path) {
    return null;
  }

  return admin.storage.from(asset.bucket).getPublicUrl(asset.storage_path).data.publicUrl;
}

function getExpectedPriceKinds(productType: ProductRow["product_type"]) {
  if (productType === "custom-cake" || productType === "wedding-cake") {
    return ["base", "per-serving"] as const;
  }

  return ["base", "per-unit"] as const;
}

function getFallbackPriceValue(
  productType: ProductRow["product_type"],
  kind: "base" | "per-serving" | "per-unit",
) {
  const baseline = defaultPricingBaseline[productType];

  if (kind === "base") {
    return {
      maximumAmount: baseline.base[1],
      minimumAmount: baseline.base[0],
      unitLabel: null,
    };
  }

  const range = baseline.perServing ?? baseline.perUnit ?? [0, 0];

  return {
    maximumAmount: range[1],
    minimumAmount: range[0],
    unitLabel: kind === "per-serving" ? "serving" : productType === "diy-kit" ? "kit" : productType.slice(0, -1),
  };
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

function pickCurrentPriceRows(priceRows: ProductPriceRow[]) {
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

export async function getContentAdminData(): Promise<ManagedContentSection[]> {
  return getManagedContentSections();
}

export async function getMediaLibraryData(): Promise<MediaLibraryData> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin media.");
  }

  const [{ data: assetData, error: assetError }, { data: categoryData, error: categoryError }] =
    await Promise.all([
      supabase
        .from("media_assets")
        .select(
          "alt_text, bucket, caption, created_at, id, metadata, original_filename, public_url, storage_path",
        )
        .eq("asset_kind", "image")
        .order("created_at", { ascending: false }),
      supabase
        .from("gallery_categories")
        .select("*")
        .order("display_order", { ascending: true }),
    ]);

  if (assetError) {
    throw assetError;
  }

  if (categoryError) {
    throw categoryError;
  }

  const assets = (assetData ?? []) as Array<
    Pick<
      MediaAssetRow,
      | "alt_text"
      | "bucket"
      | "caption"
      | "created_at"
      | "id"
      | "metadata"
      | "original_filename"
      | "public_url"
      | "storage_path"
    >
  >;

  if (assets.length === 0) {
    return {
      assets: [],
      categories: (categoryData ?? []) as GalleryCategoryRow[],
    };
  }

  const admin = createAdminClient();
  const previewUrls = new Map(
    await Promise.all(
      assets.map(async (asset) => [asset.id, await getMediaPreviewUrl(admin, asset)] as const),
    ),
  );

  const { data: assignmentData, error: assignmentError } = await supabase
    .from("media_assignments")
    .select("assignment_type, display_order, media_asset_id, page_key, section_key, slot_key, target_id")
    .in("media_asset_id", assets.map((asset) => asset.id));

  if (assignmentError) {
    throw assignmentError;
  }

  const assignmentsByAssetId = ((assignmentData ?? []) as Array<
    Pick<
      MediaAssignmentRow,
      | "assignment_type"
      | "display_order"
      | "media_asset_id"
      | "page_key"
      | "section_key"
      | "slot_key"
      | "target_id"
    >
  >).reduce<
    Map<
      string,
      Array<
        Pick<
          MediaAssignmentRow,
          | "assignment_type"
          | "display_order"
          | "media_asset_id"
          | "page_key"
          | "section_key"
          | "slot_key"
          | "target_id"
        >
      >
    >
  >((accumulator, assignment) => {
    const list = accumulator.get(assignment.media_asset_id) ?? [];
    list.push(assignment);
    accumulator.set(assignment.media_asset_id, list);
    return accumulator;
  }, new Map());

  return {
    assets: assets.map((asset) => {
      const assignments = assignmentsByAssetId.get(asset.id) ?? [];
      const categoryAssignments = assignments
        .filter((assignment) => assignment.assignment_type === "gallery-category" && assignment.target_id)
        .map((assignment) => ({
          categoryId: assignment.target_id as string,
          displayOrder: assignment.display_order,
        }))
        .sort((left, right) => left.displayOrder - right.displayOrder);
      const pageAssignments = assignments
        .filter((assignment) => assignment.assignment_type === "page")
        .map((assignment) => ({
          displayOrder: assignment.display_order,
          placementKey:
            mediaPlacementDefinitions.find(
              (definition) =>
                definition.pageKey === assignment.page_key &&
                definition.sectionKey === assignment.section_key &&
                definition.slotKey === assignment.slot_key,
            )?.key ?? `${assignment.page_key}.${assignment.section_key}`,
        }))
        .sort((left, right) => left.displayOrder - right.displayOrder);
      const metadata = isRecord(asset.metadata) ? asset.metadata : null;

      return {
        altText: asset.alt_text ?? "",
        caption: asset.caption ?? "",
        categoryAssignments,
        createdAt: asset.created_at,
        featured: getBooleanValue(metadata, "isFeatured") ?? false,
        filename: asset.original_filename ?? "Uploaded image",
        id: asset.id,
        pageAssignments,
        previewUrl: previewUrls.get(asset.id) ?? null,
      } satisfies MediaLibraryAsset;
    }),
    categories: (categoryData ?? []) as GalleryCategoryRow[],
  };
}

export async function getFaqAdminData() {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin FAQs.");
  }

  const { data, error } = await supabase
    .from("faq_items")
    .select("*")
    .order("category_key", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as FaqRow[];
}

export async function getTestimonialAdminData() {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin testimonials.");
  }

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TestimonialRow[];
}

export async function getProductAdminData() {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin products.");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductRow[];
}

export async function getPricingAdminData(): Promise<PricingEditorProduct[]> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin pricing.");
  }

  const [{ data: productData, error: productError }, { data: priceData, error: priceError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("display_order", { ascending: true }),
      supabase.from("product_prices").select("*").order("effective_from", { ascending: false }),
    ]);

  if (productError) {
    throw productError;
  }

  if (priceError) {
    throw priceError;
  }

  const currentPrices = pickCurrentPriceRows((priceData ?? []) as ProductPriceRow[]);

  return ((productData ?? []) as ProductRow[]).map((product) => {
    const prices = getExpectedPriceKinds(product.product_type).map((kind) => {
      const row = currentPrices.get(`${product.id}:${kind}`) ?? null;
      const fallback = getFallbackPriceValue(product.product_type, kind);

      return {
        id: row?.id ?? null,
        isActive: row?.is_active ?? true,
        kind,
        label:
          row?.label ??
          (kind === "base"
            ? "Base range"
            : kind === "per-serving"
              ? "Per serving range"
              : "Per unit range"),
        maximumAmount: row?.maximum_amount ?? fallback.maximumAmount,
        minimumAmount: row?.minimum_amount ?? fallback.minimumAmount,
        notes: row?.notes ?? null,
        unitLabel: row?.unit_label ?? fallback.unitLabel,
      };
    });
    const baseRow = prices.find((price) => price.kind === "base");

    return {
      displayOrder: product.display_order,
      id: product.id,
      isActive: product.is_active,
      name: product.name,
      prices,
      productType: product.product_type,
      requiresConsultation: product.requires_consultation,
      startingAtLabel: formatCurrency(baseRow?.minimumAmount ?? 0),
    };
  });
}
