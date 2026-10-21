import type { AnalyticsParams } from "@/lib/analytics/events";

export function getGalleryFilterCategory(category: string): string {
  const normalized = category.toLowerCase().replace(/[-_]+/g, " ").trim();
  const categories: Record<string, string> = {
    "custom cake": "Custom Cakes",
    "custom cakes": "Custom Cakes",
    celebration: "Custom Cakes",
    celebrations: "Custom Cakes",
    "sugar cookie": "Sugar Cookies",
    "sugar cookies": "Sugar Cookies",
    macaron: "Macarons",
    macarons: "Macarons",
    cupcake: "Cupcakes",
    cupcakes: "Cupcakes",
    "wedding cake": "Wedding Cakes",
    "wedding cakes": "Wedding Cakes",
    "diy kit": "DIY Kits",
    "diy kits": "DIY Kits",
  };

  return Object.hasOwn(categories, normalized) ? categories[normalized] ?? category : category;
}

export function getAdjacentInteractiveIndex(
  current: number | null,
  interactiveIndexes: readonly number[],
  direction: "next" | "previous",
) {
  if (current === null || interactiveIndexes.length === 0) {
    return current;
  }

  const currentInteractiveIndex = interactiveIndexes.indexOf(current);
  if (currentInteractiveIndex === -1) {
    return interactiveIndexes[0] ?? null;
  }

  const offset = direction === "next" ? 1 : -1;
  return interactiveIndexes[
    (currentInteractiveIndex + offset + interactiveIndexes.length) %
      interactiveIndexes.length
  ] ?? null;
}

export function getGalleryItemAnalyticsParams(
  item: { category: string },
  position: number,
  pagePath: "/" | "/gallery",
  location: string,
): AnalyticsParams {
  return {
    gallery_category: getGalleryFilterCategory(item.category).toLowerCase().replace(/\s+/g, "_"),
    gallery_position: position,
    page_path: pagePath,
    cta_location: location,
  };
}
