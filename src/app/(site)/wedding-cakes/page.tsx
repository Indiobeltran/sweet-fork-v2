import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "wedding-cakes";

export async function generateMetadata() {
  const page = await getPublicProductPageData(slug);

  return buildMetadata({
    title: page?.metadataTitle ?? "Wedding Cakes",
    description:
      page?.metadataDescription ??
      "Wedding cakes for Northern Utah celebrations, starting at $300 with companion desserts available by inquiry.",
    path: "/wedding-cakes",
  });
}

export default async function WeddingCakesPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} />;
}
