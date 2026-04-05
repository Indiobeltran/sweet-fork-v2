import { ProductPageTemplate } from "@/components/site/product-page-template";
import { productPageContent } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Custom Cakes",
  description: "Custom celebration cakes designed for birthdays, showers, and milestone gatherings.",
  path: "/custom-cakes",
});

export default function CustomCakesPage() {
  return <ProductPageTemplate content={productPageContent["custom-cakes"]} />;
}
