import { ProductPageTemplate } from "@/components/site/product-page-template";
import { productPageContent } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Wedding Cakes",
  description: "Wedding cakes and coordinated dessert planning for refined celebrations.",
  path: "/wedding-cakes",
});

export default function WeddingCakesPage() {
  return <ProductPageTemplate content={productPageContent["wedding-cakes"]} />;
}
