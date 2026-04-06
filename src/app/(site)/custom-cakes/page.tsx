import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "custom-cakes";

export async function generateMetadata() {
  const page = await getPublicProductPageData(slug);

  return buildMetadata({
    title: page?.metadataTitle ?? "Custom Cakes",
    description:
      page?.metadataDescription ??
      "Handcrafted custom cakes for birthdays, weddings, and celebrations in Centerville, Utah. Celebration cakes start at $80.",
    path: "/custom-cakes",
  });
}

export default async function CustomCakesPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} />;
}
