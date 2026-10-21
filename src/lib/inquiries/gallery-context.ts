import type { GalleryItem, InquiryProductItem, ProductType } from "@/types/domain";
import type { InquiryFormValues } from "@/lib/validations/inquiry";
// @ts-expect-error Node's strip-types runner requires the TypeScript extension.
import { MAX_INSPIRATION_NOTES_LENGTH } from "../validations/inquiry-limits.ts";

export const galleryInquiryStorageKey = "sweet-fork:gallery-inquiry:v1";
const publicIdPattern = /^[a-z0-9][a-z0-9_-]{0,95}$/i;

export type GalleryInquiryContext = {
  id: string;
  title: string;
  productType: ProductType;
  productLabel: string;
};

const categoryAliases = new Map<string, { productType: ProductType; productLabel: string }>([
  ...["custom cake", "custom cakes", "celebration", "celebrations"].map((alias) => [alias, { productType: "custom-cake", productLabel: "Custom Cakes" }] as const),
  ...["wedding cake", "wedding cakes"].map((alias) => [alias, { productType: "wedding-cake", productLabel: "Wedding Cakes" }] as const),
  ...["sugar cookie", "sugar cookies"].map((alias) => [alias, { productType: "sugar-cookies", productLabel: "Sugar Cookies" }] as const),
  ...["cupcake", "cupcakes"].map((alias) => [alias, { productType: "cupcakes", productLabel: "Cupcakes" }] as const),
  ...["macaron", "macarons"].map((alias) => [alias, { productType: "macarons", productLabel: "Macarons" }] as const),
  ...["diy kit", "diy kits"].map((alias) => [alias, { productType: "diy-kit", productLabel: "DIY Kits" }] as const),
]);

export function getGalleryInquiryContext(item: GalleryItem): GalleryInquiryContext | null {
  const category = categoryAliases.get(item.category.toLowerCase().replace(/[-_]+/g, " ").trim());
  const title = item.title.replace(/\s+/g, " ").trim();
  if (!category || !item.imageUrl || !publicIdPattern.test(item.id) || !title || title.length > 120) {
    return null;
  }
  return { id: item.id, title, ...category };
}

type SelectionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getSelectionStorage(storage?: SelectionStorage) {
  return storage ?? (typeof window === "undefined" ? undefined : window.sessionStorage);
}

export function saveGalleryInquirySelection(id: string, storage?: SelectionStorage) {
  if (!publicIdPattern.test(id)) return false;
  try {
    const target = getSelectionStorage(storage);
    if (!target) return false;
    target.setItem(galleryInquiryStorageKey, id);
    return true;
  } catch {
    return false;
  }
}

export function readGalleryInquirySelection(contexts: readonly GalleryInquiryContext[], storage?: SelectionStorage) {
  try {
    const id = getSelectionStorage(storage)?.getItem(galleryInquiryStorageKey);
    if (!id || !publicIdPattern.test(id)) return null;
    // The list comes from the public gallery on the server, never from storage.
    // Reading does not consume the selection, including React StrictMode reads.
    return contexts.find((context) => context.id === id) ?? null;
  } catch {
    return null;
  }
}

export function clearGalleryInquirySelection(storage?: SelectionStorage) {
  try {
    getSelectionStorage(storage)?.removeItem(galleryInquiryStorageKey);
  } catch {
    // A disabled browser store must never block the inquiry.
  }
}

export function applyGalleryInquiryContext(
  values: InquiryFormValues,
  context: GalleryInquiryContext,
  defaultItem: InquiryProductItem,
): { status: "added" | "already_added" | "notes_full"; values: InquiryFormValues } {
  const existingItem = values.orderItems.find((item) => item.productType === context.productType);
  const note = `The Sweet Fork gallery: ${context.title}`;
  const existingNotes = existingItem?.inspirationNotes ?? "";
  if (existingNotes.split("\n").includes(note)) return { status: "already_added", values };
  const inspirationNotes = existingNotes ? `${existingNotes}\n${note}` : note;
  if (inspirationNotes.length > MAX_INSPIRATION_NOTES_LENGTH) return { status: "notes_full", values };

  const orderItems = existingItem
    ? values.orderItems.map((item) => item === existingItem ? { ...item, inspirationNotes } : item)
    : [...values.orderItems, { ...defaultItem, productType: context.productType, inspirationNotes }];
  return { status: "added", values: { ...values, orderItems } };
}
