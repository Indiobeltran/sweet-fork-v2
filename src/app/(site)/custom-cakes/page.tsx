import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "custom-cakes";

export async function generateMetadata() {
  return buildMetadata({
    title: "Custom Cakes in Centerville, UT",
    description:
      "Order custom birthday and celebration cakes baked from scratch in Centerville, Utah. Starting at $80, with local pickup and select delivery.",
    path: "/custom-cakes",
  });
}

export default async function CustomCakesPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} showcaseItems={page.showcaseItems} />;
}
