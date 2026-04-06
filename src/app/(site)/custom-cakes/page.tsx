import { ProductPageTemplate } from "@/components/site/product-page-template";
import { productPageContent } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Custom Cakes",
  description:
    "Handcrafted custom cakes for birthdays, weddings, and celebrations in Centerville, Utah. Celebration cakes start at $80.",
  path: "/custom-cakes",
});

export default function CustomCakesPage() {
  return <ProductPageTemplate content={productPageContent["custom-cakes"]} />;
}
