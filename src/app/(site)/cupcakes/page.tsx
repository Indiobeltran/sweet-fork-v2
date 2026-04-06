import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "cupcakes";

export async function generateMetadata() {
  const page = await getPublicProductPageData(slug);

  return buildMetadata({
    title: page?.metadataTitle ?? "Cupcakes",
    description:
      page?.metadataDescription ??
      "Custom cupcakes for showers, birthdays, and dessert tables in Centerville, Utah. Starting at $36 per dozen.",
    path: "/cupcakes",
  });
}

export default async function CupcakesPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} />;
}
