import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "wedding-cakes";

export async function generateMetadata() {
  return buildMetadata({
    title: "Wedding Cakes in Northern Utah",
    description:
      "Plan a custom wedding cake for Northern Utah celebrations, with Centerville pickup and select local delivery. Wedding cakes start at $300.",
    path: "/wedding-cakes",
  });
}

export default async function WeddingCakesPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} showcaseItems={page.showcaseItems} />;
}
