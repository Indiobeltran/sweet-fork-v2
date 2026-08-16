import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "cupcakes";

export async function generateMetadata() {
  return buildMetadata({
    title: "Custom Cupcakes in Centerville, UT",
    description:
      "Order custom cupcakes for birthdays, showers, weddings, and dessert tables in Centerville, Utah. Starting at $36 per dozen.",
    path: "/cupcakes",
  });
}

export default async function CupcakesPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} showcaseItems={page.showcaseItems} />;
}
