import { ProductPageTemplate } from "@/components/site/product-page-template";
import { productPageContent } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cupcakes",
  description: "Custom cupcake assortments for showers, birthdays, and dessert tables.",
  path: "/cupcakes",
});

export default function CupcakesPage() {
  return <ProductPageTemplate content={productPageContent.cupcakes} />;
}
