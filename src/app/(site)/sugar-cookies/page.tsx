import { ProductPageTemplate } from "@/components/site/product-page-template";
import { productPageContent } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sugar Cookies",
  description: "Decorated sugar cookies for favors, gifting, and polished celebration tables.",
  path: "/sugar-cookies",
});

export default function SugarCookiesPage() {
  return <ProductPageTemplate content={productPageContent["sugar-cookies"]} />;
}
