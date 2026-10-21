import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types runner requires the TypeScript extension.
import { applyGalleryInquiryContext, clearGalleryInquirySelection, galleryInquiryStorageKey, getGalleryInquiryContext, readGalleryInquirySelection, saveGalleryInquirySelection } from "./gallery-context.ts";
// @ts-expect-error Node's strip-types runner requires the TypeScript extension.
import { createDefaultInquiryItem } from "./config.ts";
import type { GalleryItem } from "@/types/domain";
import type { InquiryFormValues } from "@/lib/validations/inquiry";

const publicItem: GalleryItem = {
  id: "gal-01", title: "Ivory floral cake", category: "custom-cakes",
  alt: "Ivory cake with flowers", imageUrl: "/gallery/floral-cake.jpg",
};
const context = getGalleryInquiryContext(publicItem)!;
const values: InquiryFormValues = {
  eventType: "Birthday", eventDate: "2027-04-15", guestCount: 40,
  fulfillmentMethod: "pickup", budgetRange: "150-300", budgetFlexibility: "moderate",
  orderItems: [{ productType: "sugar-cookies", quantity: 2, cookieCount: 24, inspirationNotes: "Keep my notes." }],
  colorPalette: "Blue", inspirationLinks: ["https://example.com/inspiration"],
  inspirationText: "Keep this style note.", customerName: "Example", customerEmail: "example@example.com",
  customerPhone: "8015551234", preferredContact: "email", additionalNotes: "Keep all other answers.",
};

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}

describe("verified gallery inquiry context", () => {
  it("maps only public image items with supported categories and bounded IDs/titles", () => {
    assert.deepEqual(context, { id: "gal-01", title: "Ivory floral cake", productType: "custom-cake", productLabel: "Custom Cakes" });
    for (const patch of [
      { category: "unlisted product" }, { category: "constructor" }, { imageUrl: null },
      { id: "https://example.com/private" }, { id: "x".repeat(97) }, { title: "x".repeat(121) },
    ]) assert.equal(getGalleryInquiryContext({ ...publicItem, ...patch }), null);
  });

  it("stores only an ID and resolves it against the server-provided list without consuming reads", () => {
    const storage = memoryStorage();
    assert.equal(saveGalleryInquirySelection(context.id, storage), true);
    assert.equal(storage.getItem(galleryInquiryStorageKey), context.id);
    assert.equal(readGalleryInquirySelection([context], storage), context);
    assert.equal(readGalleryInquirySelection([context], storage), context);
    assert.equal(readGalleryInquirySelection([], storage), null);
    storage.setItem(galleryInquiryStorageKey, "unknown-public-id");
    assert.equal(readGalleryInquirySelection([context], storage), null);
    assert.equal(saveGalleryInquirySelection("private@example.com", storage), false);
    clearGalleryInquirySelection(storage);
    assert.equal(storage.getItem(galleryInquiryStorageKey), null);
  });

  it("is inert when session storage is missing or unavailable", () => {
    assert.equal(saveGalleryInquirySelection(context.id), false);
    assert.equal(readGalleryInquirySelection([context]), null);
    assert.doesNotThrow(() => clearGalleryInquirySelection());
    const storage = {
      getItem: () => { throw new Error("disabled"); },
      setItem: () => { throw new Error("disabled"); },
      removeItem: () => { throw new Error("disabled"); },
    };
    assert.equal(saveGalleryInquirySelection(context.id, storage), false);
    assert.equal(readGalleryInquirySelection([context], storage), null);
    assert.doesNotThrow(() => clearGalleryInquirySelection(storage));
  });

  it("adds only the selected category and inspiration reference without overwriting a draft", () => {
    const original = structuredClone(values);
    const result = applyGalleryInquiryContext(values, context, createDefaultInquiryItem(context.productType));
    assert.equal(result.status, "added");
    assert.deepEqual(values, original);
    assert.deepEqual(result.values, {
      ...values,
      orderItems: [...values.orderItems, {
        productType: "custom-cake", quantity: 1,
        inspirationNotes: "The Sweet Fork gallery: Ivory floral cake",
      }],
    });
    assert.equal(result.values.orderItems[0], values.orderItems[0]);
  });

  it("appends to existing item notes, preserves its details, and does not duplicate an applied reference", () => {
    const draft = { ...values, orderItems: [{ productType: "custom-cake" as const, quantity: 1, servings: 40, flavorNotes: "Vanilla", inspirationNotes: "Existing note." }] };
    const result = applyGalleryInquiryContext(draft, context, createDefaultInquiryItem(context.productType));
    assert.equal(result.status, "added");
    assert.deepEqual(result.values.orderItems[0], { ...draft.orderItems[0], inspirationNotes: "Existing note.\nThe Sweet Fork gallery: Ivory floral cake" });
    const duplicate = applyGalleryInquiryContext(result.values, context, createDefaultInquiryItem(context.productType));
    assert.equal(duplicate.status, "already_added");
    assert.equal(duplicate.values, result.values);
  });

  it("rejects overflowing notes without truncation and accepts exactly the existing 1200-character limit", () => {
    const note = `The Sweet Fork gallery: ${context.title}`;
    const makeDraft = (length: number) => ({ ...values, orderItems: [{ productType: "custom-cake" as const, quantity: 1, inspirationNotes: "a".repeat(length) }] });
    const full = makeDraft(1200 - note.length);
    const rejected = applyGalleryInquiryContext(full, context, createDefaultInquiryItem(context.productType));
    assert.equal(rejected.status, "notes_full");
    assert.equal(rejected.values, full);
    const accepted = applyGalleryInquiryContext(makeDraft(1199 - note.length), context, createDefaultInquiryItem(context.productType));
    assert.equal(accepted.status, "added");
    assert.equal(accepted.values.orderItems[0]?.inspirationNotes?.length, 1200);
  });
});
