import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types runner requires the .ts extension.
import { getGalleryAltText, prettifyFileName } from "./gallery-text.ts";

describe("gallery text fallbacks", () => {
  it("never turns camera identifiers into fallback titles or alt text", () => {
    for (const filename of [
      "IMG_1234.JPG", "IMG_E1234 2.jpg", "DSC_0001 (1).png",
      "DSCN1234.jpeg", "DSCF1234.webp", "PXL_20261020_123456789.jpg",
      "MVIMG_20261020_123456.jpg", "DJI_0123.jpg", "Img 1234", "Dsc 1234 edited",
    ]) {
      assert.equal(prettifyFileName(filename), "Gallery image");
      assert.equal(getGalleryAltText({ altText: null, category: "Sugar Cookies", title: filename }),
        "Sugar Cookies by The Sweet Fork");
    }
  });

  it("keeps descriptive image names and captions useful", () => {
    assert.equal(prettifyFileName("floral-buttercream-cake.jpg"), "Floral Buttercream Cake");
    assert.equal(getGalleryAltText({ altText: null, category: "Custom Cakes", title: "Pink birthday cake" }),
      "Pink birthday cake, custom cakes");
    assert.equal(getGalleryAltText({ altText: null, category: "Sugar Cookies", title: "Floral sugar cookies" }),
      "Floral sugar cookies");
  });

  it("preserves meaningful authored alt text while rejecting camera identifiers", () => {
    assert.equal(getGalleryAltText({ altText: " White cake with raspberries. ", category: "Custom Cakes", title: "IMG_1234" }),
      "White cake with raspberries.");
    assert.equal(getGalleryAltText({ altText: "DSC_0123.JPG", category: "Custom Cakes", title: "White cake" }),
      "White cake, custom cakes");
  });

  it("uses only known information when image metadata is missing", () => {
    assert.equal(prettifyFileName(null), "Gallery image");
    assert.equal(getGalleryAltText({ altText: "", category: undefined, title: "Gallery image" }),
      "Custom dessert by The Sweet Fork");
    assert.equal(getGalleryAltText({ altText: null, category: "Wedding Cakes", title: "Gallery image" }),
      "Wedding Cakes by The Sweet Fork");
  });
});
