import { ProductPageTemplate } from "@/components/site/product-page-template";
import { productPageContent } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "DIY Kits",
  description: "Interactive decorating kits for parties, gifting, classrooms, and hosted events.",
  path: "/diy-kits",
});

export default function DiyKitsPage() {
  return <ProductPageTemplate content={productPageContent["diy-kits"]} />;
}
