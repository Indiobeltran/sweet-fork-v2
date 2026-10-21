import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types runner requires the TypeScript extension.
import { getAdjacentInteractiveIndex, getGalleryItemAnalyticsParams } from "./gallery-analytics.ts";

describe("gallery navigation analytics", () => {
  const items = [
    { category: "celebration", title: "First photo", imageUrl: "/private-name.jpg" },
    { category: "Cupcakes", title: "No photo", imageUrl: null },
    { category: "sugar_cookie", title: "Destination photo", imageUrl: "/customer-name.jpg" },
  ];
  const interactiveIndexes = [0, 2];

  it("reports the destination category and lightbox position while skipping imageless cards", () => {
    const destination = getAdjacentInteractiveIndex(0, interactiveIndexes, "next");
    assert.equal(destination, 2);
    assert.deepEqual(
      getGalleryItemAnalyticsParams(
        items[destination!]!,
        interactiveIndexes.indexOf(destination!) + 1,
        "/gallery",
        "gallery_lightbox",
      ),
      {
        gallery_category: "sugar_cookies",
        gallery_position: 2,
        page_path: "/gallery",
        cta_location: "gallery_lightbox",
      },
    );
  });

  it("wraps in both directions through interactive cards", () => {
    assert.equal(getAdjacentInteractiveIndex(2, interactiveIndexes, "next"), 0);
    assert.equal(getAdjacentInteractiveIndex(0, interactiveIndexes, "previous"), 2);
    assert.equal(getAdjacentInteractiveIndex(2, interactiveIndexes, "previous"), 0);
  });

  it("does not invent a navigation destination for a closed or single-item lightbox", () => {
    assert.equal(getAdjacentInteractiveIndex(null, interactiveIndexes, "next"), null);
    assert.equal(getAdjacentInteractiveIndex(0, [0], "next"), 0);
    assert.equal(getAdjacentInteractiveIndex(null, [], "previous"), null);
  });

  it("distinguishes homepage controls and clicks without exposing image URLs or titles", () => {
    for (const location of ["home_gallery_next", "home_gallery_previous", "home_gallery_dot", "home_gallery_card", "home_gallery_link"]) {
      assert.deepEqual(getGalleryItemAnalyticsParams(items[0], 1, "/", location), {
        gallery_category: "custom_cakes",
        gallery_position: 1,
        page_path: "/",
        cta_location: location,
      });
    }
  });

  it("preserves unknown category labels without reading object prototype properties", () => {
    assert.equal(
      getGalleryItemAnalyticsParams({ category: "constructor" }, 1, "/gallery", "gallery_grid").gallery_category,
      "constructor",
    );
  });
});
