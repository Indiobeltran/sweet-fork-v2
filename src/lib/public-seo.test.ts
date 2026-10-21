import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { bakeryEntityId, buildBakeryJsonLd, buildBakeryPriceRange, buildBakeryReference, buildBrandedTitle, buildCanonicalUrl, serializeJsonLd } from "./public-seo.ts";

describe("public SEO policy", () => {
  it("keeps route canonicals on the apex production origin", () => {
    assert.equal(buildCanonicalUrl("/gallery"), "https://thesweetfork.com/gallery");
    assert.equal(
      buildCanonicalUrl("https://www.thesweetfork.com/pricing?source=preview#guide"),
      "https://thesweetfork.com/pricing",
    );
    assert.equal(
      buildCanonicalUrl("https://branch--sweet-fork-v2.netlify.app/custom-cakes"),
      "https://thesweetfork.com/custom-cakes",
    );
    assert.equal(buildCanonicalUrl("/"), "https://thesweetfork.com/");
    const doubleSlashPath = buildCanonicalUrl("https://preview.example//outside.example/gallery?private=value#private");
    assert.equal(new URL(doubleSlashPath).origin, "https://thesweetfork.com");
    assert.equal(new URL(doubleSlashPath).pathname, "//outside.example/gallery");
    assert.equal(new URL(doubleSlashPath).search, "");
    assert.equal(new URL(doubleSlashPath).hash, "");
  });

  it("includes exactly one brand suffix for plain and already branded titles", () => {
    for (const title of [
      "Cake Ordering & Delivery FAQs",
      "Cake Ordering & Delivery FAQs | The Sweet Fork",
      "Cake Ordering & Delivery FAQs | The Sweet Fork | The Sweet Fork",
    ]) {
      assert.equal(
        buildBrandedTitle(title, "The Sweet Fork"),
        "Cake Ordering & Delivery FAQs | The Sweet Fork",
      );
    }
    assert.equal(buildBrandedTitle("The Sweet Fork", "The Sweet Fork"), "The Sweet Fork");
  });

  it("normalizes repeated managed suffix segments without removing title prose", () => {
    assert.equal(
      buildBrandedTitle("Gallery | The Sweet Fork", "The Sweet Fork | The Sweet Fork"),
      "Gallery | The Sweet Fork",
    );
    assert.equal(
      buildBrandedTitle("Gallery | the sweet fork | THE SWEET FORK", " The Sweet Fork | the sweet fork "),
      "Gallery | The Sweet Fork",
    );
    assert.equal(
      buildBrandedTitle("Gallery | The Sweet Fork | Centerville | The Sweet Fork | Centerville", "The Sweet Fork | Centerville | The Sweet Fork"),
      "Gallery | The Sweet Fork | Centerville",
    );
    assert.equal(
      buildBrandedTitle("Gallery | The Sweet Fork", "The Sweet Fork | Centerville"),
      "Gallery | The Sweet Fork | Centerville",
    );
    assert.equal(
      buildBrandedTitle("The Sweet Fork cake story | Centerville", "The Sweet Fork"),
      "The Sweet Fork cake story | Centerville | The Sweet Fork",
    );
    assert.equal(buildBrandedTitle("Cake ordering | Centerville", " | "), "Cake ordering | Centerville");
  });

  it("derives the schema price range from current pricing rows", () => {
    assert.equal(buildBakeryPriceRange([
      { product: "Custom Cakes", startingAt: "$80" },
      { product: "DIY Kits", startingAt: "$25" },
      { product: "Wedding Cakes", startingAt: "$300" },
    ]), "$25 and up; custom cakes from $80");
    assert.equal(buildBakeryPriceRange([
      { product: "Celebration Cakes", slug: "custom-cakes", startingAt: "$95" },
      { product: "DIY Kits", slug: "diy-kits", startingAt: "$35" },
    ]), "$35 and up; custom cakes from $95");
    assert.equal(buildBakeryPriceRange([
      { product: "Wedding Cakes", startingAt: "$1,200" },
      { product: "Macarons", startingAt: "$36.50" },
    ]), "$36.50 and up");
    assert.equal(buildBakeryPriceRange([
      { product: "Custom Cakes", startingAt: "By quote" },
    ]), undefined);
  });

  it("joins the bakery and product providers under one public identity", () => {
    const site = {
        name: "The Sweet Fork",
        description: "Custom cakes and desserts in Centerville, Utah.",
        phone: "(801) 739-4168",
        email: "thesweetfork@yahoo.com",
        instagram: "the_sweet_fork",
    };
    const pricing = [{ product: "Custom Cakes", startingAt: "$80" }];
    const bakery = buildBakeryJsonLd({
      site,
      heroImageUrl: "/approved-cake.jpg",
      pricing,
    });
    const productProvider = buildBakeryJsonLd({
      site,
      heroImageUrl: "/approved-product-hero.jpg",
      pricing,
    });
    assert.equal(bakery["@id"], "https://thesweetfork.com/#bakery");
    assert.equal(buildBakeryReference("The Sweet Fork")["@id"], bakeryEntityId);
    assert.equal(bakery.hasMenu, "https://thesweetfork.com/pricing");
    assert.equal(productProvider["@id"], bakery["@id"]);
    assert.equal(productProvider.priceRange, bakery.priceRange);
    assert.equal(productProvider.hasMenu, bakery.hasMenu);
    assert.equal(productProvider.logo, bakery.logo);
    assert.equal(productProvider.image[1], "https://thesweetfork.com/approved-product-hero.jpg");
    assert.deepEqual(bakery.image, [
      "https://thesweetfork.com/brand/logo-social.jpg",
      "https://thesweetfork.com/approved-cake.jpg",
    ]);
    assert.deepEqual(bakery.areaServed.slice(0, 5), [
      { "@type": "City", name: "Centerville, Utah" },
      { "@type": "City", name: "Bountiful, Utah" },
      { "@type": "City", name: "Farmington, Utah" },
      { "@type": "City", name: "Kaysville, Utah" },
      { "@type": "AdministrativeArea", name: "Davis County, Utah" },
    ]);
    assert.equal("streetAddress" in bakery.address, false);
    assert.equal("postalCode" in bakery.address, false);
    assert.equal("openingHours" in bakery, false);
  });

  it("serializes dynamic schema text without allowing script termination", () => {
    const value = { description: "A cake </script><script>alert('test')</script>" };
    const serialized = serializeJsonLd(value);
    assert.doesNotMatch(serialized, /<\/script>/i);
    assert.deepEqual(JSON.parse(serialized), value);
  });
});
