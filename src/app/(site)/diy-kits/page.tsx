import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "diy-kits";

export async function generateMetadata() {
  return buildMetadata({
    title: "DIY Decorating Kits in Centerville, Utah",
    description:
      "DIY decorating kits for parties, gifting, classrooms, and family activities in Centerville, Utah. Starting at $25.",
    path: "/diy-kits",
  });
}

export default async function DiyKitsPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} showcaseItems={page.showcaseItems} />;
}
