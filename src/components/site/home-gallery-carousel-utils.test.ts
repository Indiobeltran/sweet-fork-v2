import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getHomeGalleryCarouselWindow, getNextHomeGalleryCarouselIndex, orderHomeGalleryCarouselItems } from "./home-gallery-carousel-utils.ts";

const items = [
  { id: "cake-1", category: "Custom Cakes" },
  { id: "cake-2", category: "Custom Cakes" },
  { id: "cookie-1", category: "Sugar Cookies" },
  { id: "cupcake-1", category: "Cupcakes" },
  { id: "macaron-1", category: "Macarons" },
  { id: "wedding-1", category: "Wedding Cakes" },
  { id: "diy-1", category: "DIY Kits" },
] as const;

describe("home gallery carousel helpers", () => {
  it("wraps the visible window through the full item list", () => {
    assert.deepEqual(
      getHomeGalleryCarouselWindow(items, { startIndex: 5, visibleCount: 3 }).map(
        (item) => item.id,
      ),
      ["wedding-1", "diy-1", "cake-1"],
    );
  });

  it("uses one prominent item on mobile and three items on larger screens", () => {
    assert.equal(getHomeGalleryCarouselWindow(items, { startIndex: 2, visibleCount: 1 }).length, 1);
    assert.equal(getHomeGalleryCarouselWindow(items, { startIndex: 2, visibleCount: 3 }).length, 3);
  });

  it("advances by one slide and wraps back to the first item", () => {
    assert.equal(getNextHomeGalleryCarouselIndex(0, items.length), 1);
    assert.equal(getNextHomeGalleryCarouselIndex(items.length - 1, items.length), 0);
  });

  it("spreads repeated categories apart when possible", () => {
    assert.deepEqual(
      orderHomeGalleryCarouselItems(items).map((item) => item.id),
      ["cake-1", "cookie-1", "cupcake-1", "macaron-1", "wedding-1", "diy-1", "cake-2"],
    );
  });
});
