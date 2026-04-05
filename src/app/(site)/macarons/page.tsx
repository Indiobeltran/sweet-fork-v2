import { ProductPageTemplate } from "@/components/site/product-page-template";
import { productPageContent } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Macarons",
  description: "Macaron assortments for dessert tables, gifting, and coordinated event styling.",
  path: "/macarons",
});

export default function MacaronsPage() {
  return <ProductPageTemplate content={productPageContent.macarons} />;
}
