import { notFound } from "next/navigation";

import { ProductPageTemplate } from "@/components/site/product-page-template";
import { buildMetadata } from "@/lib/seo";
import { getPublicProductPageData } from "@/lib/site/marketing";

const slug = "sugar-cookies";

export async function generateMetadata() {
  return buildMetadata({
    title: "Custom Sugar Cookies in Centerville, UT",
    description:
      "Order decorated sugar cookies for birthdays, showers, favors, and dessert tables in Centerville, Utah. Starting at $48 per dozen.",
    path: "/sugar-cookies",
  });
}

export default async function SugarCookiesPage() {
  const page = await getPublicProductPageData(slug);

  if (!page) {
    notFound();
  }

  return <ProductPageTemplate content={page.content} showcaseItems={page.showcaseItems} />;
}
