import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getMediaPlacementBadgeLabel, getPlacementWarnings, isProminentMediaPlacement, isSingleSlotMediaPlacement, isProductShowcasePlacement, sortMediaAssetsByPlacementUse, convertStoredOrderToUiPosition, convertUiPositionToStoredOrder, type MediaPlacementWarning } from "./media-placement-utils.ts";

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
    assert.equal(isProminentMediaPlacement("home.hero"), true);
    assert.equal(isProminentMediaPlacement("home.gallery"), true);
    assert.equal(isProminentMediaPlacement("product.gallery.custom-cakes"), false);
    assert.equal(isProminentMediaPlacement("gallery.grid"), false);
    assert.equal(isProductShowcasePlacement("product.gallery.custom-cakes"), true);

    // Single slot checks
    assert.equal(isSingleSlotMediaPlacement("home.hero"), true);
    assert.equal(isSingleSlotMediaPlacement("home.gallery"), false);
    assert.equal(isSingleSlotMediaPlacement("product.hero.custom-cakes"), true);
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

  it("determines assignment age prioritizing assigned_at, then createdAt, then updatedAt", () => {
    const staleDateStr = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString();
    const freshDateStr = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    // Case 1: metadata.assigned_at is fresh, but createdAt and updatedAt are stale -> should NOT be stale
    const warnings1 = getPlacementWarnings(
      [{
        id: "asset-1",
        pageAssignments: [{
          assignmentId: "a1",
          displayOrder: 10,
          placementKey: "product.hero.custom-cakes",
          createdAt: staleDateStr,
          updatedAt: staleDateStr,
          metadata: { assigned_at: freshDateStr }
        }]
      }],
      placementDefinitions
    );
    assert.equal(warnings1.filter(w => w.type === "stale").length, 0);

    // Case 2: metadata.assigned_at is missing, createdAt is fresh, updatedAt is stale -> should NOT be stale
    const warnings2 = getPlacementWarnings(
      [{
        id: "asset-1",
        pageAssignments: [{
          assignmentId: "a1",
          displayOrder: 10,
          placementKey: "product.hero.custom-cakes",
          createdAt: freshDateStr,
          updatedAt: staleDateStr,
        }]
      }],
      placementDefinitions
    );
    assert.equal(warnings2.filter(w => w.type === "stale").length, 0);

    // Case 3: metadata.assigned_at and createdAt are missing, updatedAt is fresh -> should NOT be stale
    const warnings3 = getPlacementWarnings(
      [{
        id: "asset-1",
        pageAssignments: [{
          assignmentId: "a1",
          displayOrder: 10,
          placementKey: "product.hero.custom-cakes",
          updatedAt: freshDateStr,
        }]
      }],
      placementDefinitions
    );
    assert.equal(warnings3.filter(w => w.type === "stale").length, 0);

    // Case 4: metadata.assigned_at is stale, but stale_acknowledged_at is within 90 days -> should NOT be stale
    const warnings4 = getPlacementWarnings(
      [{
        id: "asset-1",
        pageAssignments: [{
          assignmentId: "a1",
          displayOrder: 10,
          placementKey: "product.hero.custom-cakes",
          createdAt: staleDateStr,
          metadata: {
            assigned_at: staleDateStr,
            stale_acknowledged_at: freshDateStr
          }
        }]
      }],
      placementDefinitions
    );
    assert.equal(warnings4.filter(w => w.type === "stale").length, 0);
  });

  it("converts stored display order to UI position and vice versa with clamping", () => {
    assert.equal(convertStoredOrderToUiPosition(10, 5), 1);
    assert.equal(convertStoredOrderToUiPosition(20, 5), 2);
    assert.equal(convertStoredOrderToUiPosition(30, 5), 3);

    // Clamping behavior: if stored order converts to a position greater than total count, clamp to max
    assert.equal(convertStoredOrderToUiPosition(100, 5), 5);
    // Clamping behavior: if stored order converts to less than 1, clamp to 1
    assert.equal(convertStoredOrderToUiPosition(0, 5), 1);
    assert.equal(convertStoredOrderToUiPosition(-5, 5), 1);

    // UI position -> stored order
    assert.equal(convertUiPositionToStoredOrder(1), 10);
    assert.equal(convertUiPositionToStoredOrder(4), 40);
    assert.equal(convertUiPositionToStoredOrder(0), 10); // Clamps to 10
  });

  it("enforces single-slot conflict and missing warnings correctly for home.hero vs home.gallery", () => {
    const definitions = [
      {
        description: "Homepage Hero",
        key: "home.hero",
        label: "Homepage Hero",
        pageKey: "home",
        sectionKey: "hero",
        slotKey: "hero",
      },
      {
        description: "Homepage Gallery Teaser",
        key: "home.gallery",
        label: "Homepage Gallery Teaser",
        pageKey: "home",
        sectionKey: "gallery",
        slotKey: "gallery",
      },
    ];

    // Case 1: home.hero is missing and home.gallery is also empty -> should ONLY warn about missing home.hero
    const warningsMissing = getPlacementWarnings([], definitions);
    const missingKeys = warningsMissing.map(w => w.placementKey);
    assert.ok(missingKeys.includes("home.hero"));
    assert.ok(!missingKeys.includes("home.gallery"));
    assert.equal(warningsMissing.find(w => w.placementKey === "home.hero")?.type, "missing");

    // Case 2: home.hero has multiple assigned assets -> should trigger a conflict warning
    const warningsConflictHero = getPlacementWarnings(
      [
        {
          id: "asset-1",
          pageAssignments: [{ assignmentId: "a1", displayOrder: 10, placementKey: "home.hero" }],
        },
        {
          id: "asset-2",
          pageAssignments: [{ assignmentId: "a2", displayOrder: 20, placementKey: "home.hero" }],
        },
      ],
      definitions
    );
    const conflictHero = warningsConflictHero.find(w => w.placementKey === "home.hero" && w.type === "conflict");
    assert.ok(conflictHero);
    assert.equal(conflictHero.severity, "high");

    // Case 3: home.gallery has multiple assigned assets -> should NOT trigger any conflict warnings
    const warningsGallery = getPlacementWarnings(
      [
        {
          id: "asset-1",
          pageAssignments: [{ assignmentId: "a1", displayOrder: 10, placementKey: "home.gallery" }],
        },
        {
          id: "asset-2",
          pageAssignments: [{ assignmentId: "a2", displayOrder: 20, placementKey: "home.gallery" }],
        },
      ],
      definitions
    );
    const conflictGallery = warningsGallery.find(w => w.placementKey === "home.gallery" && w.type === "conflict");
    assert.equal(conflictGallery, undefined);
  });
});
