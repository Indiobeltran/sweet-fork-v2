import Link from "next/link";

import { PublicPageHero } from "@/components/site/public-page-hero";
import { getPublicPricingData } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Pricing",
    description:
      "Starting prices for custom cakes, wedding cakes, cupcakes, sugar cookies, macarons, and DIY kits in Centerville, Utah.",
    path: "/pricing",
  });
}

export default async function PricingPage() {
  const data = await getPublicPricingData();
  const hasPricing = data.matrix.length > 0;

  return (
    <div>
      <PublicPageHero
        eyebrow="Pricing"
        title="Starting prices for custom cakes, wedding cakes, and treats."
        description="Every order is custom, so final pricing depends on design, size, flavors, and details. These starting prices reflect the current live menu."
        accent="Pickup is free in Centerville. Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities, with fees based on location."
      />
      {hasPricing ? (
        <section className="section-shell grid gap-4 py-16 md:grid-cols-3 md:py-20">
          {data.highlights.map((item) => (
            <article key={item.label} className="rounded-[1.8rem] border border-charcoal/8 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/48">{item.label}</p>
              <h2 className="mt-6 font-serif text-4xl tracking-[-0.04em] text-charcoal">{item.value}</h2>
              <p className="mt-3 text-sm leading-7 text-charcoal/68">{item.note}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="border-t border-charcoal/8 bg-cream/70 py-16 md:py-20">
        {hasPricing ? (
          <div className="section-shell overflow-hidden rounded-[2rem] border border-charcoal/8 bg-white shadow-soft">
            <div className="grid grid-cols-4 border-b border-charcoal/8 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/50">
              <span>Product</span>
              <span>Starting at</span>
              <span>Details</span>
              <span>Lead time</span>
            </div>
            {data.matrix.map((row) => (
              <div key={row.product} className="grid gap-4 border-b border-charcoal/8 px-6 py-5 text-sm text-charcoal/72 last:border-none md:grid-cols-4">
                <p className="font-medium text-charcoal">{row.product}</p>
                <p>{row.startingAt}</p>
                <p>{row.rule}</p>
                <p>{row.leadTime}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="section-shell">
            <div className="rounded-[2rem] border border-charcoal/10 bg-white px-6 py-8 shadow-soft sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                Pricing update
              </p>
              <h2 className="mt-3 text-balance font-serif text-4xl tracking-[-0.04em] text-charcoal">
                Public pricing is temporarily unavailable.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/68">
                The current live product list does not include any active public offerings. Use the
                booking notice and contact details on the site for the latest availability update.
              </p>
            </div>
          </div>
        )}
        <div className="section-shell mt-8">
          <Link href="/start-order" className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal">
            Start an order inquiry
          </Link>
        </div>
      </section>
    </div>
  );
}
