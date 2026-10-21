import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "custom-cakes";

export async function generateMetadata() {
  return buildMetadata({
    title: "Custom Cakes in Davis County, Utah",
    description:
      "From-scratch custom cakes for Davis County celebrations. Starting at $80, with Centerville pickup and select local delivery. Request a quote.",
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
