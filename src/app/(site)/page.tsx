import Link from "next/link";

import { GalleryGrid } from "@/components/site/gallery-grid";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { SectionHeading } from "@/components/site/section-heading";
import { SitePrimaryCta } from "@/components/site/site-primary-cta";
import { getHomePageData } from "@/lib/site/marketing";

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-charcoal/8 bg-paper">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
        <div className="section-shell grid min-h-[calc(100svh-7rem)] gap-12 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-16 lg:py-20">
          <div className="space-y-7 section-reveal">
            <p className="eyebrow-label">{data.hero.eyebrow}</p>
            <div className="space-y-5">
              <h1 className="max-w-5xl font-serif text-[3.5rem] leading-[0.88] tracking-[-0.06em] text-charcoal sm:text-[4.75rem] lg:text-[6rem]">
                {data.hero.heading}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-charcoal/72 sm:text-lg">
                {data.hero.body}
              </p>
            </div>
            <SitePrimaryCta
              href={data.hero.settings.primaryCtaHref ?? "/start-order"}
              label={data.hero.settings.primaryCtaLabel ?? "Start Your Inquiry"}
              subtext="Takes 2–3 minutes • No commitment required"
            />
          </div>

          <div className="grid gap-4 section-reveal">
            <div className="luxury-panel overflow-hidden rounded-[2.4rem] bg-charcoal p-7 text-ivory sm:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-gold/72">The Sweet Fork</p>
              <p className="mt-6 font-serif text-5xl leading-[0.92] tracking-[-0.05em]">
                Handcrafted desserts with a quiet luxury finish.
              </p>
              <div className="mt-8 space-y-4 border-t border-white/10 pt-6 text-sm leading-7 text-ivory/70">
                <p>Custom cakes, wedding work, cupcakes, macarons, decorated cookies, and DIY kits.</p>
                <p>Pickup in Centerville. Local delivery available across nearby Northern Utah communities.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {data.hero.items.map((item) => (
                <div key={item.title} className="luxury-panel rounded-[1.6rem] px-5 py-5">
                  <p className="text-sm font-medium text-charcoal">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-charcoal/64">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <SectionHeading
            eyebrow="Signature offerings"
            title="A dessert menu built for celebrations that deserve something more tailored."
            description="Every order begins with an inquiry so the scale, finish, and service plan can fit the event instead of forcing you into a fixed cart."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {data.offerings.map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className="luxury-panel rounded-[1.8rem] px-6 py-6 transition duration-300 hover:-translate-y-1"
              >
                <p className="eyebrow-label">{item.eyebrow}</p>
                <h2 className="mt-5 font-serif text-3xl leading-none tracking-[-0.04em] text-charcoal">
                  {item.shortTitle}
                </h2>
                <p className="mt-3 text-sm leading-7 text-charcoal/68">{item.intro}</p>
                <p className="mt-5 text-sm font-semibold text-charcoal">Explore the collection</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-charcoal/8 bg-cream/65 py-16 md:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.96fr_1.04fr]">
          <SectionHeading
            eyebrow={data.weddingHighlight.eyebrow}
            title={data.weddingHighlight.heading}
            description={data.weddingHighlight.body}
          />
          <div className="luxury-panel rounded-[2rem] px-6 py-6 sm:px-8">
            <p className="eyebrow-label">Why couples inquire early</p>
            <div className="mt-5 space-y-4 text-sm leading-8 text-charcoal/68">
              <p>Wedding dates are limited, especially during spring, summer, and holiday weekends.</p>
              <p>Companion desserts like macarons, cupcakes, and cookies can be quoted in the same inquiry for a cohesive dessert display.</p>
              <p>Delivery and setup planning are easiest when venue logistics are discussed from the start.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Gallery"
            title="A closer look at recent cakes, cookies, macarons, cupcakes, and sweet-table details."
            description="The gallery stays intentionally curated so the work feels clear, elevated, and easy to browse on mobile."
          />
          <Link href="/gallery" className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal">
            View full gallery
          </Link>
        </div>
        <div className="mt-10">
          <GalleryGrid items={data.galleryItems} compact />
        </div>
      </section>

      <section className="border-t border-charcoal/8 bg-charcoal py-16 text-ivory md:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <SectionHeading
            eyebrow={data.process.eyebrow}
            title={data.process.heading}
            description={data.process.body}
          />
          <div className="space-y-4">
            {data.process.items.map((item) => (
              <article key={item.step} className="rounded-[1.8rem] border border-white/10 bg-white/6 px-6 py-6">
                <div className="flex items-start gap-4">
                  <p className="font-serif text-5xl leading-none tracking-[-0.05em] text-gold">{item.step}</p>
                  <div>
                    <h3 className="text-lg font-medium text-ivory">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-ivory/72">{item.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <SectionHeading
          eyebrow="Client notes"
          title="Kind words from Sweet Fork celebrations."
          description="A few of the comments that capture the blend of taste, finish, and hospitality clients remember."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {data.testimonials.map((item) => (
            <blockquote key={item.name} className="luxury-panel rounded-[1.8rem] px-6 py-6">
              <p className="font-serif text-3xl leading-tight tracking-[-0.04em] text-charcoal">“{item.quote}”</p>
              <footer className="mt-6 text-sm text-charcoal/64">
                <p className="font-medium text-charcoal">{item.name}</p>
                <p>{item.context}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <InquiryCta />
    </div>
  );
}
