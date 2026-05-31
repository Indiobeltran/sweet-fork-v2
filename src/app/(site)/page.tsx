import Image from "next/image";
import Link from "next/link";

import { GalleryGrid } from "@/components/site/gallery-grid";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { SectionHeading } from "@/components/site/section-heading";
import { SitePrimaryCta } from "@/components/site/site-primary-cta";
import { getPublicEnv } from "@/lib/env";
import { siteConfig } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";
import { getHomePageData } from "@/lib/site/marketing";

export async function generateMetadata() {
  return buildMetadata({
    title: "Custom Cakes & Desserts in Centerville, Utah",
    description:
      "Custom cakes, wedding cakes, cupcakes, macarons, sugar cookies, and DIY kits crafted in Centerville, Utah with a polished, boutique finish.",
    path: "/",
  });
}

export default async function HomePage() {
  const data = await getHomePageData();
  const { siteUrl } = getPublicEnv();
  const heroGalleryItem = data.galleryItems.find((item) => item.imageUrl) ?? null;
  const featuredTestimonial = data.testimonials[0] ?? null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    image: `${siteUrl}/brand/logo-social.jpg`,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
      addressLocality: "Centerville",
      addressRegion: "UT",
    },
    areaServed: [
      "Centerville",
      "Davis County",
      "Salt Lake County",
      "Weber County",
      "Northern Utah",
    ],
    sameAs: [`https://www.instagram.com/${siteConfig.instagram}/`],
    servesCuisine: "Desserts",
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative overflow-hidden border-b border-charcoal/8 bg-paper">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
        <div className="section-shell grid gap-9 py-10 sm:py-12 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-16 lg:py-20">
          <div className="space-y-6 section-reveal">
            <p className="eyebrow-label">{data.hero.eyebrow}</p>
            <div className="space-y-5">
              <h1 className="max-w-5xl font-serif text-[3rem] leading-[0.9] tracking-[-0.04em] text-charcoal sm:text-[4.35rem] lg:text-[6rem] lg:tracking-[-0.06em]">
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
            <div className="relative overflow-hidden rounded-[2.4rem] border border-charcoal/12 bg-charcoal text-ivory shadow-[0_18px_48px_rgba(53,37,29,0.18),0_2px_10px_rgba(53,37,29,0.08)]">
              <div className="relative min-h-[19rem] sm:min-h-[28rem] lg:min-h-[34rem]">
                {heroGalleryItem?.imageUrl ? (
                  <Image
                    src={heroGalleryItem.imageUrl}
                    alt={heroGalleryItem.alt}
                    fill
                    priority
                    quality={82}
                    sizes="(max-width: 1024px) calc(100vw - 2.5rem), 44vw"
                    className="object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,39,33,0.04),rgba(48,39,33,0.32)_48%,rgba(48,39,33,0.82))]" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-[0.22em] text-gold/82">
                    The Sweet Fork
                  </p>
                  <p className="mt-4 max-w-[25rem] font-serif text-4xl leading-[0.92] tracking-[-0.05em] sm:text-5xl">
                    Handcrafted desserts with a quiet luxury finish.
                  </p>
                  <div className="mt-6 space-y-3 border-t border-white/16 pt-5 text-sm leading-7 text-ivory/84">
                    <p>
                      Custom cakes, wedding work, cupcakes, macarons, decorated cookies, and DIY
                      kits.
                    </p>
                    <p>
                      Pickup in Centerville. Local delivery available across nearby Northern Utah
                      communities.
                    </p>
                  </div>
                </div>
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

            {featuredTestimonial ? (
              <blockquote className="rounded-[1.6rem] border border-charcoal/8 bg-white/72 px-5 py-5 shadow-soft">
                <p className="text-sm leading-7 text-charcoal/72">
                  “{featuredTestimonial.quote}”
                </p>
                <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/48">
                  {featuredTestimonial.name}
                </footer>
              </blockquote>
            ) : null}
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
            tone="inverse"
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
          title="Kind words from The Sweet Fork celebrations."
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
