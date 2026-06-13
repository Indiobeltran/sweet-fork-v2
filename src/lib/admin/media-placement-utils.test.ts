import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getMediaPlacementBadgeLabel, getPlacementWarnings, isProminentMediaPlacement, isProductShowcasePlacement, sortMediaAssetsByPlacementUse, type MediaPlacementWarning } from "./media-placement-utils.ts";

const placementDefinitions = [
  {
    description: "Hero image shown at the top of the Custom Cakes product page.",
    key: "product.hero.custom-cakes",
    label: "Product Page Hero - Custom Cakes",
    pageKey: "product",
    sectionKey: "hero",
    slotKey: "custom-cakes",
  },
  {
    description: "Carousel examples shown on the Custom Cakes product page.",
    key: "product.gallery.custom-cakes",
    label: "Product Page Examples - Custom Cakes",
    pageKey: "product",
    sectionKey: "gallery",
    slotKey: "custom-cakes",
  },
  {
    description: "Primary portfolio photos shown on the dedicated Gallery page.",
    key: "gallery.grid",
    label: "Gallery page grid",
    pageKey: "gallery",
    sectionKey: "grid",
    slotKey: "gallery",
  },
  {
    description: "Hero image shown at the top of the DIY Kits product page.",
    key: "product.hero.diy-kits",
    label: "Product Page Hero - DIY Kits",
    pageKey: "product",
    sectionKey: "hero",
    slotKey: "diy-kits",
  },
] as const;

describe("admin media placement semantics", () => {
  it("treats prominent placements differently from gallery and product examples", () => {
    assert.equal(isProminentMediaPlacement("product.hero.custom-cakes"), true);
    assert.equal(isProminentMediaPlacement("home.offering.cupcakes"), true);
    assert.equal(isProminentMediaPlacement("product.gallery.custom-cakes"), false);
    assert.equal(isProminentMediaPlacement("gallery.grid"), false);
    assert.equal(isProductShowcasePlacement("product.gallery.custom-cakes"), true);
  });

  it("creates owner-friendly placement badge labels", () => {
    assert.equal(
      getMediaPlacementBadgeLabel("product.hero.custom-cakes", placementDefinitions),
      "Product hero: Custom Cakes",
    );
    assert.equal(
      getMediaPlacementBadgeLabel("product.gallery.custom-cakes", placementDefinitions),
      "Product examples: Custom Cakes",
    );
    assert.equal(getMediaPlacementBadgeLabel("gallery.grid", placementDefinitions), "Full gallery");
    assert.equal(
      getMediaPlacementBadgeLabel("product.hero.diy-kits", placementDefinitions),
      "Product hero: DIY Kits",
    );
  });

  it("reports only missing required homepage and product hero/card placements", () => {
    const warnings = getPlacementWarnings(
      [
        {
          id: "asset-1",
          pageAssignments: [{ assignmentId: "a1", displayOrder: 10, placementKey: "product.hero.custom-cakes" }],
        },
        {
          id: "asset-2",
          pageAssignments: [{ assignmentId: "a2", displayOrder: 10, placementKey: "product.hero.diy-kits" }],
        },
      ],
      [
        ...placementDefinitions,
        {
          description: "Image shown on the Cupcakes card in Signature Offerings.",
          key: "home.offering.cupcakes",
          label: "Signature Offering - Cupcakes",
          pageKey: "home",
          sectionKey: "offerings",
          slotKey: "cupcakes",
        },
      ],
    );

    assert.deepEqual(warnings.map((warning: MediaPlacementWarning) => warning.placementKey), [
      "home.offering.cupcakes",
    ]);
    assert.match(warnings[0]?.message ?? "", /Cupcakes/);
    assert.doesNotMatch(warnings[0]?.message ?? "", /full gallery/i);
  });

  it("sorts prominent placements first, then product examples, then legacy highlights", () => {
    const sorted = sortMediaAssetsByPlacementUse([
      {
        createdAt: "2026-01-04T00:00:00.000Z",
        featured: false,
        id: "gallery-only",
        pageAssignments: [{ displayOrder: 10, assignmentId: "a4", placementKey: "gallery.grid" }],
      },
      {
        createdAt: "2026-01-03T00:00:00.000Z",
        featured: true,
        id: "legacy-highlight",
        pageAssignments: [],
      },
      {
        createdAt: "2026-01-02T00:00:00.000Z",
        featured: false,
        id: "product-examples",
        pageAssignments: [{ displayOrder: 10, assignmentId: "a3", placementKey: "product.gallery.custom-cakes" }],
      },
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        featured: false,
        id: "hero-1",
        pageAssignments: [{ assignmentId: "h1", displayOrder: 10, placementKey: "product.hero.custom-cakes" }],
      },
    ]);

    assert.deepEqual(sorted.map((asset) => asset.id), [
      "hero-1",
      "product-examples",
      "legacy-highlight",
      "gallery-only",
    ]);
  });
});
