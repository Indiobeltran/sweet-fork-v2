import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { defaultPricingBaseline } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import {
  footerNavigation,
  faqItems as staticFaqItems,
  galleryItems as staticGalleryItems,
  homeExperiencePillars,
  pricingHighlights as staticPricingHighlights,
  pricingMatrix as staticPricingMatrix,
  primaryNavigation,
  processSteps as staticProcessSteps,
  productPageContent,
  secondaryNavigation,
  siteConfig,
  testimonials as staticTestimonials,
  websiteContentSections,
} from "@/lib/content/site-content";
import type { ProductType, GalleryItem } from "@/types/domain";
import type { Enums, Json, Tables } from "@/types/supabase.generated";

type SiteSettingKey =
  | "brand.identity"
  | "contact.primary"
  | "social.instagram"
  | "seo.defaults";

type ContentSectionKey =
  | "home.hero"
  | "weddings.highlight"
  | "home.process"
  | "about.story";

type SiteSettingFieldDefinition = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type: "email" | "text" | "textarea" | "url";
};

export type SiteSettingDefinition = {
  key: SiteSettingKey;
  categoryKey: string;
  description: string;
  fields: SiteSettingFieldDefinition[];
  label: string;
  public: boolean;
  fallback: Record<string, string>;
};

type ContentItemDefinition = Record<string, string>;

export type ContentSectionDefinition = {
  key: ContentSectionKey;
  title: string;
  description: string;
  pageKey: string;
  sectionKey: string;
  blockKey: string;
  blockType: Enums<"content_block_type">;
  fallback: {
    body: string;
    eyebrow: string;
    heading: string;
    items: ContentItemDefinition[];
    settings: Record<string, string>;
  };
};

export type MediaPlacementDefinition = {
  key: string;
  label: string;
  pageKey: string;
  sectionKey: string;
  slotKey: string;
};

type SiteSettingRow = Tables<"site_settings">;
type ContentBlockRow = Tables<"content_blocks">;
type MediaAssetRow = Tables<"media_assets">;
type MediaAssignmentRow = Tables<"media_assignments">;
type GalleryCategoryRow = Tables<"gallery_categories">;
type ProductRow = Pick<
  Tables<"products">,
  | "display_order"
  | "id"
  | "is_active"
  | "long_description"
  | "name"
  | "product_type"
  | "requires_consultation"
  | "short_description"
  | "slug"
>;
type ProductPriceRow = Pick<
  Tables<"product_prices">,
  | "effective_from"
  | "effective_to"
  | "id"
  | "is_active"
  | "label"
  | "maximum_amount"
  | "minimum_amount"
  | "notes"
  | "price_kind"
  | "product_id"
  | "unit_label"
>;

export type ManagedSiteSetting = {
  definition: SiteSettingDefinition;
  rowId: string | null;
  value: Record<string, string>;
};

export type ManagedContentSection = {
  definition: ContentSectionDefinition;
  displayOrder: number;
  isActive: boolean;
  rowId: string | null;
  value: {
    body: string;
    eyebrow: string;
    heading: string;
    items: ContentItemDefinition[];
    settings: Record<string, string>;
  };
};

export type SiteShellData = {
  description: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  location: string;
  name: string;
  phone: string;
  tagline: string;
};

export type HomePageData = {
  galleryItems: GalleryItem[];
  hero: ManagedContentSection["value"];
  offerings: Array<{
    eyebrow: string;
    intro: string;
    name: string;
    shortTitle: string;
    slug: string;
  }>;
  process: ManagedContentSection["value"];
  testimonials: Array<{
    context: string;
    name: string;
    quote: string;
  }>;
  weddingHighlight: ManagedContentSection["value"];
};

export type AboutPageData = ManagedContentSection["value"];

export type PublicFaqItem = {
  answer: string;
  question: string;
};

export type PricingMatrixItem = {
  leadTime: string;
  product: string;
  rule: string;
  startingAt: string;
};

export type PricingHighlightItem = {
  label: string;
  note: string;
  value: string;
};

export type PublicSiteLink = {
  href: string;
  label: string;
};

export type PublicBookingNotice = {
  message: string;
  title: string;
  tone: "closed" | "info" | "limited";
};

export type PublicSeoData = {
  defaultDescription: string;
  siteName: string;
  titleSuffix: string;
};

export type PublicSiteChromeData = {
  bookingNotice: PublicBookingNotice | null;
  footerLegalLinks: PublicSiteLink[];
  primaryNavigation: PublicSiteLink[];
  secondaryNavigation: PublicSiteLink[];
  site: SiteShellData;
};

export const marketingMediaBucket = "marketing";

export const mediaPlacementDefinitions: MediaPlacementDefinition[] = [
  {
    key: "home.gallery",
    label: "Homepage gallery",
    pageKey: "home",
    sectionKey: "gallery",
    slotKey: "gallery",
  },
  {
    key: "gallery.grid",
    label: "Gallery page grid",
    pageKey: "gallery",
    sectionKey: "grid",
    slotKey: "gallery",
  },
];

export const publicSitePaths = [
  "/",
  "/about",
  "/custom-cakes",
  "/cupcakes",
  "/diy-kits",
  "/faq",
  "/gallery",
  "/how-to-order",
  "/macarons",
  "/privacy",
  "/pricing",
  "/start-order",
  "/sugar-cookies",
  "/terms",
  "/wedding-cakes",
];

const productPagePaths = new Set(Object.keys(productPageContent).map((slug) => `/${slug}`));

const bookingNoticeFallback: PublicBookingNotice = {
  message:
    "Most custom orders need at least 2 weeks notice. Holiday and wedding weekends can book earlier.",
  title: "Limited booking notice",
  tone: "limited",
};

export const siteSettingDefinitions: SiteSettingDefinition[] = [
  {
    key: "brand.identity",
    categoryKey: "brand",
    description: "Shown in the site header, footer, and core brand copy.",
    fields: [
      { key: "name", label: "Brand name", required: true, type: "text" },
      {
        key: "tagline",
        label: "Short tagline",
        placeholder: "Custom cakes and desserts made to order",
        required: true,
        type: "text",
      },
      {
        key: "description",
        label: "Brand description",
        required: true,
        type: "textarea",
      },
    ],
    label: "Brand identity",
    public: true,
    fallback: {
      description: siteConfig.description,
      name: siteConfig.name,
      tagline: "Custom cakes and desserts made to order",
    },
  },
  {
    key: "contact.primary",
    categoryKey: "contact",
    description: "Shared contact details used around the marketing site.",
    fields: [
      { key: "email", label: "Email", required: true, type: "email" },
      { key: "phone", label: "Phone", required: true, type: "text" },
      { key: "location", label: "Location", required: true, type: "text" },
    ],
    label: "Primary contact",
    public: true,
    fallback: {
      email: siteConfig.email,
      location: siteConfig.location,
      phone: siteConfig.phone,
    },
  },
  {
    key: "social.instagram",
    categoryKey: "social",
    description: "Instagram handle and link shown anywhere social proof is needed.",
    fields: [
      { key: "handle", label: "Instagram handle", required: true, type: "text" },
      { key: "url", label: "Instagram URL", required: true, type: "url" },
    ],
    label: "Instagram",
    public: true,
    fallback: {
      handle: siteConfig.instagram,
      url: `https://instagram.com/${siteConfig.instagram}`,
    },
  },
  {
    key: "seo.defaults",
    categoryKey: "seo",
    description: "Simple metadata defaults without turning this into a full SEO tool.",
    fields: [
      { key: "titleSuffix", label: "Title suffix", required: true, type: "text" },
      {
        key: "defaultDescription",
        label: "Default description",
        required: true,
        type: "textarea",
      },
    ],
    label: "SEO defaults",
    public: true,
    fallback: {
      defaultDescription: siteConfig.description,
      titleSuffix: siteConfig.name,
    },
  },
];

export const contentSectionDefinitions: ContentSectionDefinition[] = [
  {
    key: "home.hero",
    title: websiteContentSections.find((section) => section.key === "home.hero")?.title ?? "Homepage Hero",
    description:
      websiteContentSections.find((section) => section.key === "home.hero")?.description ??
      "Primary landing-page statement, supporting copy, and call-to-action text.",
    pageKey: "home",
    sectionKey: "hero",
    blockKey: "main",
    blockType: "hero",
    fallback: {
      body:
        "A boutique home bakery for custom cakes and desserts designed with a polished finish, thoughtful hospitality, and limited weekly availability.",
      eyebrow: "Centerville, Utah",
      heading: "Custom cakes and desserts with a refined, made-to-order feel.",
      items: homeExperiencePillars.map((item) => ({
        description: item.description,
        title: item.title,
      })),
      settings: {
        primaryCtaHref: "/start-order",
        primaryCtaLabel: "Start Your Inquiry",
        secondaryCtaHref: "/gallery",
        secondaryCtaLabel: "Explore the Gallery",
      },
    },
  },
  {
    key: "weddings.highlight",
    title:
      websiteContentSections.find((section) => section.key === "weddings.highlight")?.title ??
      "Wedding Highlight",
    description:
      websiteContentSections.find((section) => section.key === "weddings.highlight")
        ?.description ??
      "Editorial section that positions weddings clearly without overpowering celebrations.",
    pageKey: "home",
    sectionKey: "hero",
    blockKey: "weddings-highlight",
    blockType: "rich-text",
    fallback: {
      body:
        "Wedding cakes are designed as statement pieces, with companion desserts available when you want the full table to feel cohesive.",
      eyebrow: "Wedding cakes",
      heading: "Wedding cakes are quoted with the event, table, and guest experience in mind.",
      items: [],
      settings: {},
    },
  },
  {
    key: "home.process",
    title:
      websiteContentSections.find((section) => section.key === "home.process")?.title ??
      "How It Works",
    description:
      websiteContentSections.find((section) => section.key === "home.process")?.description ??
      "Three-step process content shown before the final order CTA.",
    pageKey: "home",
    sectionKey: "process",
    blockKey: "steps",
    blockType: "feature-list",
    fallback: {
      body:
        "The process stays personal and clear from the first inquiry through the final confirmation.",
      eyebrow: "How it works",
      heading: "A simple inquiry-first process designed to keep the details easy.",
      items: staticProcessSteps.map((item) => ({
        description: item.description,
        step: item.step,
        title: item.title,
      })),
      settings: {},
    },
  },
  {
    key: "about.story",
    title:
      websiteContentSections.find((section) => section.key === "about.story")?.title ??
      "About Story",
    description:
      websiteContentSections.find((section) => section.key === "about.story")?.description ??
      "Founder-facing brand story and hospitality positioning.",
    pageKey: "about",
    sectionKey: "story",
    blockKey: "main",
    blockType: "rich-text",
    fallback: {
      body:
        "The Sweet Fork began with the idea that handmade desserts can feel both personal and beautifully composed, and it continues to grow as a small, intentional bakery serving Northern Utah.",
      eyebrow: "About",
      heading: "A small bakery rooted in Centerville, Utah, with a luxury-minded finish.",
      items: [
        {
          text:
            "What began as a passion project has become a made-to-order bakery focused on custom cakes, macarons, cupcakes, and decorated sugar cookies for celebrations across Northern Utah.",
        },
        {
          text:
            "Every order is made from scratch in a home kitchen using quality ingredients, careful technique, and an intentionally limited production calendar.",
        },
        {
          text:
            "That smaller scale allows each client to receive thoughtful guidance from inquiry through pickup or delivery.",
        },
      ],
      settings: {
        accent:
          "The Sweet Fork operates under Utah's Home Consumption and Homemade Food Act and serves Davis, Salt Lake, and nearby Weber County communities.",
        studioEyebrow: "The Sweet Fork",
        studioQuote:
          "\"Handcrafted for life's sweetest moments.\"",
      },
    },
  },
];

function isRecord(value: Json | null): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(record: Record<string, Json>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getBooleanValue(record: Record<string, Json>, key: string) {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function prettifyFileName(value: string | null) {
  if (!value) {
    return "Gallery image";
  }

  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getGalleryAltText({
  altText,
  category,
  title,
}: {
  altText: string | null | undefined;
  category: string | undefined;
  title: string;
}) {
  const trimmedAltText = altText?.trim();

  if (trimmedAltText) {
    return trimmedAltText;
  }

  if (!category) {
    return title;
  }

  const normalizedCategory = category.trim();
  return title.toLowerCase().includes(normalizedCategory.toLowerCase())
    ? title
    : `${title}, ${normalizedCategory.toLowerCase()}`;
}

function getContentDefinitionIdentity(definition: ContentSectionDefinition) {
  return `${definition.pageKey}:${definition.sectionKey}:${definition.blockKey}`;
}

export function getMediaPlacementByKey(key: string) {
  return mediaPlacementDefinitions.find((definition) => definition.key === key) ?? null;
}

function parseSiteSettingValue(
  definition: SiteSettingDefinition,
  row: SiteSettingRow | null,
): ManagedSiteSetting {
  const record =
    isRecord(row?.value_json ?? null) ? (row?.value_json as Record<string, Json>) : null;
  const value = Object.keys(definition.fallback).reduce<Record<string, string>>((accumulator, key) => {
    accumulator[key] = record ? getStringValue(record, key) ?? definition.fallback[key] : definition.fallback[key];
    return accumulator;
  }, {});

  return {
    definition,
    rowId: row?.id ?? null,
    value,
  };
}

function parseContentBlockValue(
  definition: ContentSectionDefinition,
  row: ContentBlockRow | null,
): ManagedContentSection {
  const items = Array.isArray(row?.items_json)
    ? row.items_json
    : [];
  const settingsRecord =
    isRecord(row?.settings_json ?? null)
      ? (row?.settings_json as Record<string, Json>)
      : null;
  const parsedItems = definition.fallback.items.map((fallbackItem, index) => {
    const rowItem = items[index];
    const itemRecord = isRecord(rowItem) ? rowItem : null;

    return Object.keys(fallbackItem).reduce<Record<string, string>>((accumulator, key) => {
      accumulator[key] = itemRecord ? getStringValue(itemRecord, key) ?? fallbackItem[key] : fallbackItem[key];
      return accumulator;
    }, {});
  });
  const parsedSettings = Object.keys(definition.fallback.settings).reduce<Record<string, string>>(
    (accumulator, key) => {
      accumulator[key] = settingsRecord
        ? getStringValue(settingsRecord, key) ?? definition.fallback.settings[key]
        : definition.fallback.settings[key];
      return accumulator;
    },
    {},
  );

  return {
    definition,
    displayOrder: row?.display_order ?? 0,
    isActive: row?.is_active ?? true,
    rowId: row?.id ?? null,
    value: {
      body: row?.body ?? definition.fallback.body,
      eyebrow: row?.eyebrow ?? definition.fallback.eyebrow,
      heading: row?.heading ?? definition.fallback.heading,
      items: parsedItems,
      settings: parsedSettings,
    },
  };
}

const getSiteSettingRows = cache(async function getSiteSettingRows() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("*")
    .in(
      "setting_key",
      siteSettingDefinitions.map((definition) => definition.key),
    );

  if (error) {
    console.error("Unable to load managed site settings.", error);
    return [];
  }

  return (data ?? []) as SiteSettingRow[];
});

const getContentBlockRows = cache(async function getContentBlockRows() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const pageKeys = Array.from(new Set(contentSectionDefinitions.map((definition) => definition.pageKey)));
  const admin = createAdminClient();
  const { data, error } = await admin.from("content_blocks").select("*").in("page_key", pageKeys);

  if (error) {
    console.error("Unable to load managed content blocks.", error);
    return [];
  }

  return (data ?? []) as ContentBlockRow[];
});

export async function getManagedSiteSettings() {
  const rows = await getSiteSettingRows();
  const rowsByKey = new Map(rows.map((row) => [row.setting_key as SiteSettingKey, row]));

  return siteSettingDefinitions.map((definition) =>
    parseSiteSettingValue(definition, rowsByKey.get(definition.key) ?? null),
  );
}

export async function getManagedContentSections() {
  const rows = await getContentBlockRows();
  const rowsByIdentity = new Map(
    rows.map((row) => [`${row.page_key}:${row.section_key}:${row.block_key}`, row]),
  );

  return contentSectionDefinitions.map((definition) =>
    parseContentBlockValue(definition, rowsByIdentity.get(getContentDefinitionIdentity(definition)) ?? null),
  );
}

async function getGalleryCategoryMap(categoryIds: string[]) {
  if (!isSupabaseConfigured() || categoryIds.length === 0) {
    return new Map<string, GalleryCategoryRow>();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gallery_categories")
    .select("*")
    .in("id", categoryIds)
    .eq("is_active", true);

  if (error) {
    console.error("Unable to load gallery categories for media placements.", error);
    return new Map<string, GalleryCategoryRow>();
  }

  return new Map(((data ?? []) as GalleryCategoryRow[]).map((row) => [row.id, row]));
}

function getMediaPublicUrl(asset: Pick<MediaAssetRow, "bucket" | "public_url" | "storage_path">) {
  if (asset.public_url) {
    return asset.public_url;
  }

  if (!asset.bucket || !asset.storage_path) {
    return null;
  }

  return createAdminClient().storage.from(asset.bucket).getPublicUrl(asset.storage_path).data.publicUrl;
}

function isApprovedMarketingAsset(
  asset: Pick<MediaAssetRow, "public_url" | "storage_path">,
) {
  const candidate = `${asset.public_url ?? ""} ${asset.storage_path ?? ""}`.toLowerCase();

  return !(candidate.includes("placeholders") && candidate.includes("marketing"));
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

function getFallbackLeadTime(productType: ProductType) {
  const fallbackRow = staticPricingMatrix.find((item) =>
    item.product.toLowerCase().includes(productType.replace("-", " ").split(" ")[0]),
  );

  return fallbackRow?.leadTime ?? (productType === "wedding-cake" ? "4+ weeks" : "1-2 weeks");
}

function getFallbackPricingRule(productType: ProductType) {
  const fallbackRow = staticPricingMatrix.find((item) =>
    item.product.toLowerCase().includes(productType.replace("-", " ").split(" ")[0]),
  );

  return (
    fallbackRow?.rule ??
    (productType === "wedding-cake"
      ? "Tier count, servings, and service coordination"
      : "Base price plus quantity and finishing complexity")
  );
}

function getStaticProductCards() {
  return Object.values(productPageContent).map((item) => ({
    eyebrow: item.eyebrow,
    intro: item.intro,
    name: item.shortTitle,
    shortTitle: item.shortTitle,
    slug: item.slug,
  }));
}

const getPublicProductRows = cache(async function getPublicProductRows(): Promise<ProductRow[] | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(
      "display_order, id, is_active, long_description, name, product_type, requires_consultation, short_description, slug",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    if (error) {
      console.error("Unable to load public products.", error);
    }

    return [];
  }

  return (data ?? []) as ProductRow[];
});

async function resolveFallbackGalleryItems(limit: number) {
  return staticGalleryItems.slice(0, limit).map((item) => ({
    ...item,
    imageUrl: item.imageUrl ?? null,
  }));
}

export async function getPublicSeoData(): Promise<PublicSeoData> {
  const settings = await getManagedSiteSettings();
  const byKey = new Map(settings.map((setting) => [setting.definition.key, setting.value]));
  const brand = byKey.get("brand.identity") ?? siteSettingDefinitions[0].fallback;
  const seo = byKey.get("seo.defaults") ?? siteSettingDefinitions[3].fallback;

  return {
    defaultDescription: seo.defaultDescription,
    siteName: brand.name,
    titleSuffix: seo.titleSuffix,
  };
}

export async function getPublicBookingNotice(): Promise<PublicBookingNotice | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("value_json")
    .eq("setting_key", "booking.notice")
    .maybeSingle();

  if (error) {
    console.error("Unable to load public booking notice.", error);
    return null;
  }

  const record = isRecord(data?.value_json ?? null) ? (data?.value_json as Record<string, Json>) : null;
  const enabled = record ? getBooleanValue(record, "enabled") ?? false : false;

  if (!enabled) {
    return null;
  }

  const tone = record ? getStringValue(record, "tone") : null;

  return {
    message: record ? getStringValue(record, "message") ?? bookingNoticeFallback.message : bookingNoticeFallback.message,
    title: record ? getStringValue(record, "title") ?? bookingNoticeFallback.title : bookingNoticeFallback.title,
    tone:
      tone === "closed" || tone === "limited" || tone === "info"
        ? tone
        : bookingNoticeFallback.tone,
  };
}

export async function getPublicSiteChromeData(): Promise<PublicSiteChromeData> {
  const [site, activeProducts, bookingNotice] = await Promise.all([
    getSiteShellData(),
    getPublicProductRows(),
    getPublicBookingNotice(),
  ]);

  const activeProductPaths =
    activeProducts === null
      ? productPagePaths
      : new Set(activeProducts.map((product) => `/${product.slug}`));

  return {
    bookingNotice,
    footerLegalLinks: footerNavigation,
    primaryNavigation: primaryNavigation.filter(
      (item) => !productPagePaths.has(item.href) || activeProductPaths.has(item.href),
    ),
    secondaryNavigation,
    site,
  };
}

export async function getPublicProductPageData(slug: string) {
  const fallback = productPageContent[slug];

  if (!fallback) {
    return null;
  }

  const activeProducts = await getPublicProductRows();

  if (activeProducts === null) {
    return {
      content: fallback,
      metadataDescription: fallback.intro,
      metadataTitle: fallback.shortTitle,
    };
  }

  const product = activeProducts.find((item) => item.slug === slug);

  if (!product) {
    return null;
  }

  return {
    content: {
      ...fallback,
      shortTitle: product.name,
    },
    metadataDescription: product.short_description ?? product.long_description ?? fallback.intro,
    metadataTitle: product.name,
  };
}

export async function getPublicSitemapPaths() {
  const activeProducts = await getPublicProductRows();

  if (activeProducts === null) {
    return publicSitePaths;
  }

  const activePaths = new Set(activeProducts.map((product) => `/${product.slug}`));

  return publicSitePaths.filter(
    (path) => !productPagePaths.has(path) || activePaths.has(path),
  );
}

export async function getSiteShellData(): Promise<SiteShellData> {
  const settings = await getManagedSiteSettings();
  const byKey = new Map(settings.map((setting) => [setting.definition.key, setting.value]));
  const brand = byKey.get("brand.identity") ?? siteSettingDefinitions[0].fallback;
  const contact = byKey.get("contact.primary") ?? siteSettingDefinitions[1].fallback;
  const instagram = byKey.get("social.instagram") ?? siteSettingDefinitions[2].fallback;

  return {
    description: brand.description,
    email: contact.email,
    instagramHandle: instagram.handle,
    instagramUrl: instagram.url,
    location: contact.location,
    name: brand.name,
    phone: contact.phone,
    tagline: brand.tagline,
  };
}

export async function getGalleryItemsForPlacement(
  placementKey: string,
  options: { limit?: number } = {},
): Promise<GalleryItem[]> {
  const fallbackItems = await resolveFallbackGalleryItems(
    options.limit ?? staticGalleryItems.length,
  );
  const placement = getMediaPlacementByKey(placementKey);

  if (!placement || !isSupabaseConfigured()) {
    return fallbackItems;
  }

  const admin = createAdminClient();
  const { data: placementData, error: placementError } = await admin
    .from("media_assignments")
    .select("display_order, media_asset_id")
    .eq("assignment_type", "page")
    .eq("page_key", placement.pageKey)
    .eq("section_key", placement.sectionKey)
    .eq("slot_key", placement.slotKey)
    .order("display_order", { ascending: true });

  if (placementError) {
    console.error("Unable to load page media placements.", placementError);
    return fallbackItems;
  }

  const explicitPlacements = (placementData ?? []) as Array<
    Pick<MediaAssignmentRow, "display_order" | "media_asset_id">
  >;
  const explicitAssetIds = explicitPlacements.map((row) => row.media_asset_id);

  let assets: Array<
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
  > = [];

  if (explicitAssetIds.length > 0) {
    const { data: assetData, error: assetError } = await admin
      .from("media_assets")
      .select(
        "alt_text, bucket, caption, created_at, id, metadata, original_filename, public_url, storage_path",
      )
      .in("id", explicitAssetIds)
      .eq("asset_kind", "image");

    if (assetError) {
      console.error("Unable to load placed media assets.", assetError);
      return fallbackItems;
    }

    const assetMap = new Map(
      (((assetData ?? []) as typeof assets)).map((asset) => [asset.id, asset]),
    );
    assets = explicitPlacements
      .map((placementRow) => assetMap.get(placementRow.media_asset_id))
      .filter((asset): asset is (typeof assets)[number] => Boolean(asset))
      .filter((asset) => isApprovedMarketingAsset(asset)) as typeof assets;
  } else {
    const { data: assetData, error: assetError } = await admin
      .from("media_assets")
      .select(
        "alt_text, bucket, caption, created_at, id, metadata, original_filename, public_url, storage_path",
      )
      .eq("asset_kind", "image")
      .order("created_at", { ascending: false });

    if (assetError) {
      console.error("Unable to load marketing media assets.", assetError);
      return fallbackItems;
    }

    assets = ((assetData ?? []) as typeof assets).filter((asset) => isApprovedMarketingAsset(asset));
  }

  if (assets.length === 0) {
    return fallbackItems;
  }

  const assetIds = assets.map((asset) => asset.id);
  const { data: categoryAssignmentsData, error: categoryAssignmentsError } = await admin
    .from("media_assignments")
    .select("display_order, media_asset_id, target_id")
    .eq("assignment_type", "gallery-category")
    .in("media_asset_id", assetIds)
    .order("display_order", { ascending: true });

  if (categoryAssignmentsError) {
    console.error("Unable to load gallery category assignments.", categoryAssignmentsError);
    return fallbackItems;
  }

  const categoryAssignments = (categoryAssignmentsData ?? []) as Array<
    Pick<MediaAssignmentRow, "display_order" | "media_asset_id" | "target_id">
  >;
  const categoriesById = await getGalleryCategoryMap(
    categoryAssignments
      .map((assignment) => assignment.target_id)
      .filter((value): value is string => Boolean(value)),
  );
  const assignmentsByAssetId = categoryAssignments.reduce<
    Map<string, Array<Pick<MediaAssignmentRow, "display_order" | "media_asset_id" | "target_id">>>
  >(
    (accumulator, assignment) => {
      const list = accumulator.get(assignment.media_asset_id) ?? [];
      list.push(assignment);
      accumulator.set(assignment.media_asset_id, list);
      return accumulator;
    },
    new Map(),
  );

  const sortedAssets =
    explicitPlacements.length > 0
      ? assets
      : assets
          .filter((asset) => assignmentsByAssetId.has(asset.id))
          .sort((left, right) => {
            const leftFeatured = getBooleanValue(isRecord(left.metadata) ? left.metadata : {}, "isFeatured") ?? false;
            const rightFeatured = getBooleanValue(isRecord(right.metadata) ? right.metadata : {}, "isFeatured") ?? false;

            if (leftFeatured !== rightFeatured) {
              return leftFeatured ? -1 : 1;
            }

            return right.created_at.localeCompare(left.created_at);
          });

  const filteredAssets =
    explicitPlacements.length === 0 && placement.key === "home.gallery"
      ? sortedAssets.filter((asset) => {
          const record = isRecord(asset.metadata) ? asset.metadata : null;
          return getBooleanValue(record ?? {}, "isFeatured") ?? false;
        })
      : sortedAssets;
  const finalAssets = (filteredAssets.length > 0 ? filteredAssets : sortedAssets).slice(
    0,
    options.limit ?? sortedAssets.length,
  );

  if (finalAssets.length === 0) {
    return fallbackItems;
  }

  return finalAssets.map((asset) => {
    const categoryAssignmentsForAsset = assignmentsByAssetId.get(asset.id) ?? [];
    const primaryCategory = categoryAssignmentsForAsset
      .map((assignment) => (assignment.target_id ? categoriesById.get(assignment.target_id) ?? null : null))
      .find(Boolean);
    const title = asset.caption?.trim() || prettifyFileName(asset.original_filename);
    const alt = getGalleryAltText({
      altText: asset.alt_text,
      category: primaryCategory?.name,
      title,
    });

    return {
      alt,
      category: primaryCategory?.name ?? "Celebration",
      id: asset.id,
      imageUrl: getMediaPublicUrl(asset),
      title,
    } satisfies GalleryItem;
  });
}

export async function getPublicTestimonials() {
  if (!isSupabaseConfigured()) {
    return staticTestimonials.map((item) => ({
      context: item.context,
      name: item.name,
      quote: item.quote,
    }));
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonials")
    .select("attribution_name, attribution_role, display_order, is_featured, is_published, quote, source_label")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("Unable to load public testimonials.", error);
    }

    return staticTestimonials.map((item) => ({
      context: item.context,
      name: item.name,
      quote: item.quote,
    }));
  }

  return data.slice(0, 3).map((item) => ({
    context: item.attribution_role ?? item.source_label ?? "Sweet Fork client",
    name: item.attribution_name,
    quote: item.quote,
  }));
}

export async function getPublicFaqItems(): Promise<PublicFaqItem[]> {
  if (!isSupabaseConfigured()) {
    return staticFaqItems;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("faq_items")
    .select("answer, question, category_key, display_order")
    .eq("is_published", true)
    .order("category_key", { ascending: true })
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("Unable to load public FAQs.", error);
    }

    return staticFaqItems;
  }

  return data.map((item) => ({
    answer: item.answer,
    question: item.question,
  }));
}

export async function getHomePageData(): Promise<HomePageData> {
  const [contentSections, gallery, testimonials, offerings] = await Promise.all([
    getManagedContentSections(),
    getGalleryItemsForPlacement("home.gallery", { limit: 6 }),
    getPublicTestimonials(),
    getPublicOfferingCards(),
  ]);
  const sectionsByKey = new Map(contentSections.map((section) => [section.definition.key, section]));

  return {
    galleryItems: gallery,
    hero:
      sectionsByKey.get("home.hero")?.value ??
      contentSectionDefinitions.find((definition) => definition.key === "home.hero")!.fallback,
    offerings,
    process:
      sectionsByKey.get("home.process")?.value ??
      contentSectionDefinitions.find((definition) => definition.key === "home.process")!.fallback,
    testimonials,
    weddingHighlight:
      sectionsByKey.get("weddings.highlight")?.value ??
      contentSectionDefinitions.find((definition) => definition.key === "weddings.highlight")!.fallback,
  };
}

export async function getAboutPageData(): Promise<AboutPageData> {
  const contentSections = await getManagedContentSections();
  const about = contentSections.find((section) => section.definition.key === "about.story");

  return (
    about?.value ??
    contentSectionDefinitions.find((definition) => definition.key === "about.story")!.fallback
  );
}

export async function getPublicOfferingCards() {
  const activeProducts = await getPublicProductRows();

  if (activeProducts === null) {
    return getStaticProductCards();
  }

  return activeProducts
    .filter((product) => Boolean(productPageContent[product.slug]))
    .map((product) => {
      const fallback = productPageContent[product.slug];

      return {
        eyebrow:
          fallback?.eyebrow ??
          (product.requires_consultation ? "Consultation-led" : "Core offering"),
        intro: fallback?.intro ?? product.long_description ?? product.short_description ?? "",
        name: product.name,
        shortTitle: fallback?.shortTitle ?? product.name,
        slug: product.slug,
      };
    });
}

export async function getPublicPricingData(): Promise<{
  highlights: PricingHighlightItem[];
  matrix: PricingMatrixItem[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      highlights: staticPricingHighlights,
      matrix: staticPricingMatrix,
    };
  }

  const admin = createAdminClient();
  const [{ data: productData, error: productError }, { data: priceData, error: priceError }] =
    await Promise.all([
      admin
        .from("products")
        .select(
          "display_order, id, is_active, long_description, name, product_type, requires_consultation, short_description, slug",
        )
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      admin
        .from("product_prices")
        .select(
          "effective_from, effective_to, id, is_active, label, maximum_amount, minimum_amount, notes, price_kind, product_id, unit_label",
        )
        .eq("is_active", true),
    ]);

  if (productError || priceError || !productData) {
    if (productError) {
      console.error("Unable to load public products for pricing.", productError);
    }

    if (priceError) {
      console.error("Unable to load public prices.", priceError);
    }

    return {
      highlights: staticPricingHighlights,
      matrix: staticPricingMatrix,
    };
  }

  if (productData.length === 0) {
    return {
      highlights: staticPricingHighlights,
      matrix: staticPricingMatrix,
    };
  }

  const products = productData as ProductRow[];
  const currentPrices = pickCurrentPriceRows((priceData ?? []) as ProductPriceRow[]);
  const matrix = products.map((product) => {
    const baseRow =
      currentPrices.get(`${product.id}:base`) ??
      currentPrices.get(`${product.id}:starting`);

    return {
      leadTime: getFallbackLeadTime(product.product_type),
      product: product.name,
      rule: baseRow?.notes ?? getFallbackPricingRule(product.product_type),
      startingAt: formatCurrency(
        Math.round(
          baseRow?.minimum_amount ??
            defaultPricingBaseline[product.product_type].base[0],
        ),
      ),
    } satisfies PricingMatrixItem;
  });

  const highlights = matrix.slice(0, 3).map((item, index) => ({
    label: item.product,
    note:
      products[index]?.short_description ??
      staticPricingHighlights[index]?.note ??
      "Final pricing depends on quantity, finish complexity, and calendar fit.",
    value: `Starting at ${item.startingAt}`,
  }));

  return {
    highlights: highlights.length > 0 ? highlights : staticPricingHighlights,
    matrix,
  };
}
