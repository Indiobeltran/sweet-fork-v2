import Link from "next/link";

import { PublicPageHero } from "@/components/site/public-page-hero";
import { getPublicPricingData } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing",
  description: "Starting pricing for custom cakes, wedding cakes, cupcakes, sugar cookies, macarons, and DIY kits.",
  path: "/pricing",
});

export default async function PricingPage() {
  const data = await getPublicPricingData();

  return (
    <div>
      <PublicPageHero
        eyebrow="Pricing"
        title="Transparent starting points, with room for custom scope."
        description="Pricing should set expectations without flattening custom work into a rigid menu. These ranges preserve current logic while staying ready for future automation."
        accent="Quoting gets more accurate because the intake captures event details and multiple products before the first manual reply."
      />
      <section className="section-shell grid gap-4 py-16 md:grid-cols-3 md:py-20">
        {data.highlights.map((item) => (
          <article key={item.label} className="rounded-[1.8rem] border border-charcoal/8 bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/48">{item.label}</p>
            <h2 className="mt-6 font-serif text-4xl tracking-[-0.04em] text-charcoal">{item.value}</h2>
            <p className="mt-3 text-sm leading-7 text-charcoal/68">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="border-t border-charcoal/8 bg-cream/70 py-16 md:py-20">
        <div className="section-shell overflow-hidden rounded-[2rem] border border-charcoal/8 bg-white shadow-soft">
          <div className="grid grid-cols-4 border-b border-charcoal/8 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/50">
            <span>Product</span>
            <span>Starting at</span>
            <span>Logic</span>
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
        <div className="section-shell mt-8">
          <Link href="/start-order" className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal">
            Start an inquiry with estimated range support
          </Link>
        </div>
      </section>
    </div>
  );
}
