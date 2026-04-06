import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "sugar-cookies";

export async function generateMetadata() {
  const page = await getPublicProductPageData(slug);

  return buildMetadata({
    title: page?.metadataTitle ?? "Sugar Cookies",
    description:
      page?.metadataDescription ??
      "Decorated sugar cookies for favors, gifting, and dessert tables in Centerville, Utah. Starting at $48 per dozen.",
    path: "/sugar-cookies",
  });
}

export default async function SugarCookiesPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} />;
}
