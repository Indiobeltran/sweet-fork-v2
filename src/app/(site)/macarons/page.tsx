import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "macarons";

export async function generateMetadata() {
  const page = await getPublicProductPageData(slug);

  return buildMetadata({
    title: page?.metadataTitle ?? "Macarons",
    description:
      page?.metadataDescription ??
      "Custom macarons for gifting, dessert tables, and events in Centerville, Utah. Starting at $30 per dozen.",
    path: "/macarons",
  });
}

export default async function MacaronsPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} />;
}
