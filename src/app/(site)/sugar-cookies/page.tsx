import { notFound } from "next/navigation";
import Link from "next/link";

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

  return (
    <ProductPageTemplate
      content={page.content}
      showcaseItems={page.showcaseItems}
      localContext={
        <section className="section-shell py-12 md:py-16" aria-labelledby="local-cookie-orders">
          <div className="max-w-3xl space-y-4">
            <p className="eyebrow-label">Made locally, for your occasion</p>
            <h2 id="local-cookie-orders" className="font-serif text-3xl leading-tight text-charcoal sm:text-4xl">
              Cookie favors for celebrations across Davis County.
            </h2>
            <p className="text-base leading-8 text-charcoal/76">
              From a birthday in Bountiful to a shower in Farmington or a gathering in Kaysville,
              I design each cookie set around the people and occasion it is for. Pickup is in
              Centerville, with the address shared after booking; local delivery is quoted by location.
            </p>
            <p className="text-base leading-8 text-charcoal/76">
              Browse the <Link className="underline decoration-gold underline-offset-4" href="/gallery">cake and cookie gallery</Link> for
              inspiration, check the <Link className="underline decoration-gold underline-offset-4" href="/pricing">starting-price guide</Link>, or
              read <Link className="underline decoration-gold underline-offset-4" href="/how-to-order">how to order</Link> before
              sharing your date and the number of dozens you have in mind.
            </p>
          </div>
        </section>
      }
    />
  );
}
