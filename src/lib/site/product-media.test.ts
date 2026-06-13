import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getProductGalleryCategoryNames, getSafeObjectPosition } from "./product-media.ts";

describe("product media helpers", () => {
  it("maps every product page slug to its gallery category names", () => {
    assert.deepEqual(getProductGalleryCategoryNames("custom-cakes"), ["Custom Cakes"]);
    assert.deepEqual(getProductGalleryCategoryNames("wedding-cakes"), ["Wedding Cakes"]);
    assert.deepEqual(getProductGalleryCategoryNames("cupcakes"), ["Cupcakes"]);
    assert.deepEqual(getProductGalleryCategoryNames("sugar-cookies"), ["Sugar Cookies"]);
    assert.deepEqual(getProductGalleryCategoryNames("macarons"), ["Macarons"]);
    assert.deepEqual(getProductGalleryCategoryNames("diy-kits"), ["DIY Kits"]);
    assert.deepEqual(getProductGalleryCategoryNames("unknown"), []);
  });

  it("keeps image object-position values safe for inline styles", () => {
    assert.equal(getSafeObjectPosition({ x: 0.35, y: 0.2 }), "35% 20%");
    assert.equal(getSafeObjectPosition({ x: 42, y: 58 }), "42% 58%");
    assert.equal(
      getSafeObjectPosition(null, { objectPosition: "center 38%" }),
      "center 38%",
    );
    assert.equal(
      getSafeObjectPosition(null, { objectPosition: "url(javascript:alert(1))" }),
      "center center",
    );
  });
});
