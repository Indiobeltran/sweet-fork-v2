import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { getPublicPricingData } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Pricing",
    description:
      "A starting-price investment guide for custom cakes, wedding cakes, cupcakes, sugar cookies, macarons, and DIY kits in Centerville, Utah.",
    path: "/pricing",
  });
}

export default async function PricingPage() {
  const data = await getPublicPricingData();
  const defaultCta = getInquiryCtaBySlug();

  return (
    <div>
      <PublicPageHero
        eyebrow="Pricing"
        title="A clear starting-point investment guide for custom cakes and desserts."
        description="Every Sweet Fork order is quoted individually, but these starting prices help set expectations before you submit an inquiry."
        accent="Public pricing stays intentionally high level so the final quote can reflect your real guest count, finish, and service needs."
        cta={defaultCta}
      />

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {data.highlights.map((item) => (
            <article key={item.label} className="luxury-panel rounded-[1.85rem] px-6 py-6">
              <p className="eyebrow-label">{item.label}</p>
              <h2 className="mt-5 font-serif text-4xl tracking-[-0.04em] text-charcoal">{item.value}</h2>
              <p className="mt-3 text-sm leading-7 text-charcoal/66">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-charcoal/8 bg-cream/70 py-16 md:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <p className="eyebrow-label">Starting prices</p>
            <h2 className="font-serif text-5xl leading-[0.92] tracking-[-0.05em] text-charcoal">
              Custom work starts with a baseline, then becomes more specific from there.
            </h2>
            <p className="text-base leading-8 text-charcoal/68">
              Final quotes are shaped by quantity, servings, finish complexity, delivery, and overall event scope. The guide below keeps the public side simple while still setting helpful expectations.
            </p>
          </div>

          <div className="luxury-panel overflow-hidden rounded-[2.1rem]">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr] border-b border-charcoal/8 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/62">
              <span>Offering</span>
              <span>Starts at</span>
              <span>Lead time</span>
            </div>
            {data.matrix.map((row) => (
              <div
                key={row.product}
                className="grid gap-3 border-b border-charcoal/8 px-6 py-5 text-sm text-charcoal/68 last:border-none md:grid-cols-[1.1fr_0.8fr_0.8fr]"
              >
                <div>
                  <p className="font-medium text-charcoal">{row.product}</p>
                  <p className="mt-1 leading-7">{row.rule}</p>
                </div>
                <p className="font-medium text-charcoal">{row.startingAt}</p>
                <p>{row.leadTime}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="luxury-panel rounded-[1.8rem] px-6 py-6">
            <p className="eyebrow-label">Pickup</p>
            <p className="mt-4 font-serif text-3xl tracking-[-0.04em] text-charcoal">Included</p>
            <p className="mt-3 text-sm leading-7 text-charcoal/66">
              Pickup in Centerville is available at no additional charge.
            </p>
          </article>
          <article className="luxury-panel rounded-[1.8rem] px-6 py-6">
            <p className="eyebrow-label">Delivery</p>
            <p className="mt-4 font-serif text-3xl tracking-[-0.04em] text-charcoal">$15–$50+</p>
            <p className="mt-3 text-sm leading-7 text-charcoal/66">
              Delivery is available across nearby Northern Utah communities and is quoted by location.
            </p>
          </article>
          <article className="luxury-panel rounded-[1.8rem] px-6 py-6">
            <p className="eyebrow-label">Reserve the date</p>
            <p className="mt-4 font-serif text-3xl tracking-[-0.04em] text-charcoal">50% deposit</p>
            <p className="mt-3 text-sm leading-7 text-charcoal/66">
              The date is secured once the quote is approved and the deposit is received.
            </p>
          </article>
        </div>
      </section>

      <InquiryCta
        title="Ready for a quote tailored to your event?"
        description="The inquiry form is the fastest way to share the details Sweet Fork needs to confirm fit, timing, and next steps."
      />
    </div>
  );
}
