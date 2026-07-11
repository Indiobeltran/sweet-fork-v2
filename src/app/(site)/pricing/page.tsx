import { VisibilityAnalytics } from "@/components/analytics/visibility-analytics";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { getPublicPricingData } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Pricing",
    description:
      "Starting prices for custom cakes, wedding cakes, cupcakes, sugar cookies, macarons, and DIY kits from The Sweet Fork in Centerville, Utah.",
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
        title="Starting prices for custom cakes and desserts."
        description="Every celebration is different, so custom orders are quoted individually. These starting prices show the typical minimums; the final quote reflects servings, quantity, design detail, packaging, and pickup or delivery needs."
        accent="Use these starting prices to check fit before sharing your date and celebration details with Melissa."
        cta={defaultCta}
      />

      <section className="border-y border-charcoal/8 bg-cream/70 py-16 md:py-20">
        <VisibilityAnalytics
          eventName="pricing_section_viewed"
          params={{
            page_path: "/pricing",
            cta_location: "pricing_matrix",
          }}
        />
        <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <p className="eyebrow-label">Starting prices</p>
            <h2 className="font-serif text-5xl leading-[0.92] tracking-[-0.05em] text-charcoal">
              Clear pricing guidance before you inquire.
            </h2>
            <p className="text-base leading-8 text-charcoal/68">
              Final quotes are shaped by quantity, servings, piping and finish details, packaging, delivery, and the overall event scope.
            </p>
          </div>

          <div className="luxury-panel overflow-hidden rounded-[2.1rem]">
            <div className="hidden grid-cols-[1.1fr_0.8fr_0.8fr] border-b border-charcoal/8 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/62 md:grid">
              <span>Offering</span>
              <span>Starts at</span>
              <span>Lead time</span>
            </div>
            <div className="md:hidden">
              {data.matrix.map((row) => (
                <article
                  key={row.product}
                  className="border-b border-charcoal/8 px-5 py-5 text-charcoal/68 last:border-none"
                >
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Offering
                    </p>
                    <h3 className="font-serif text-[2rem] leading-none tracking-[-0.04em] text-charcoal">
                      {row.product}
                    </h3>
                    <p className="text-sm leading-7">{row.rule}</p>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 rounded-[1.5rem] border border-charcoal/8 bg-cream/55 p-4">
                    <div className="space-y-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                        Starts at
                      </dt>
                      <dd className="text-base font-medium text-charcoal">{row.startingAt}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                        Lead time
                      </dt>
                      <dd className="text-base font-medium text-charcoal">{row.leadTime}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            <div className="hidden md:block">
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
              Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, distance, and order details.
            </p>
          </article>
          <article className="luxury-panel rounded-[1.8rem] px-6 py-6">
            <p className="eyebrow-label">Reserve the date</p>
            <p className="mt-4 font-serif text-3xl tracking-[-0.04em] text-charcoal">50% deposit</p>
            <p className="mt-3 text-sm leading-7 text-charcoal/66">
              The date is secured once the quote is approved and the 50% non-refundable deposit is received. An inquiry alone does not reserve it.
            </p>
          </article>
        </div>
      </section>

      <InquiryCta
        title="Ready for a custom quote for your event?"
        description="Share your date, desserts, quantities, budget, and inspiration. Melissa will review the request and follow up with availability, a custom quote, and next steps."
      />
    </div>
  );
}
