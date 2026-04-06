import { ProductPageTemplate } from "@/components/site/product-page-template";
import { productPageContent } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Macarons",
  description:
    "Custom macarons for gifting, dessert tables, and events in Centerville, Utah. Starting at $30 per dozen.",
  path: "/macarons",
});

export default function MacaronsPage() {
  return <ProductPageTemplate content={productPageContent.macarons} />;
}
