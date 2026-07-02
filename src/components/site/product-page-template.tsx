import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProductAnalytics } from "@/components/analytics/product-analytics";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { SectionHeading } from "@/components/site/section-heading";
import { SitePrimaryCta } from "@/components/site/site-primary-cta";
import { StickyProductCta } from "@/components/site/sticky-product-cta";
import { getProductCategory } from "@/lib/analytics/events";
import { getPublicEnv } from "@/lib/env";
import { siteConfig } from "@/lib/content/site-content";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import type { GalleryItem, ProductPageContent } from "@/types/domain";

type ProductPageTemplateProps = {
  content: ProductPageContent;
  showcaseItems?: GalleryItem[];
};

export function ProductPageTemplate({
  content,
  showcaseItems = [],
}: ProductPageTemplateProps) {
  const cta = getInquiryCtaBySlug(content.slug);
  const { siteUrl } = getPublicEnv();
  const pageUrl = new URL(`/${content.slug}`, siteUrl).toString();
  const galleryHref = "/gallery";
  const hasShowcaseItems = showcaseItems.length > 0;
  const productCategory = getProductCategory(content.slug);
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${content.shortTitle} by ${siteConfig.name}`,
    description: content.intro,
    areaServed: [
      "Centerville",
      "Davis County",
      "Salt Lake County",
      "Weber County",
      "Northern Utah",
    ],
    image: new URL(content.heroImage.src, siteUrl).toString(),
    provider: {
      "@type": "Bakery",
      name: siteConfig.name,
      url: siteUrl,
      telephone: siteConfig.phone,
      email: siteConfig.email,
      address: {
        "@type": "PostalAddress",
        addressCountry: "US",
        addressLocality: "Centerville",
        addressRegion: "UT",
      },
    },
    url: pageUrl,
  };

  return (
    <div className="pb-24 md:pb-0">
      <ProductAnalytics slug={content.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <section className="relative overflow-hidden border-b border-charcoal/8 bg-paper">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
        <div className="section-shell grid gap-9 py-10 sm:py-12 md:py-18 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-16">
          <div className="space-y-6 section-reveal">
            <p className="eyebrow-label">{content.eyebrow}</p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-balance font-serif text-4xl leading-[0.96] tracking-[-0.035em] text-charcoal sm:text-5xl lg:text-7xl lg:tracking-[-0.05em]">
                {content.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-charcoal/72 sm:text-lg">
                {content.intro}
              </p>
            </div>
            <SitePrimaryCta
              href={cta.href}
              label={cta.label}
              subtext={cta.subtext}
              analyticsEvent={
                content.slug === "wedding-cakes"
                  ? "wedding_consultation_started"
                  : "product_cta_clicked"
              }
              analyticsParams={{
                cta_location: "product_hero",
                page_path: `/${content.slug}`,
                product_category: productCategory,
                product_slug: content.slug,
              }}
            />
          </div>

          <div className="grid gap-4 section-reveal">
            <div className="relative overflow-hidden rounded-[2rem] border border-charcoal/12 bg-charcoal shadow-soft sm:rounded-[2.4rem]">
              <div className="relative aspect-[4/5] min-h-[22rem] sm:min-h-[30rem] lg:min-h-[34rem]">
                <Image
                  src={content.heroImage.src}
                  alt={content.heroImage.alt}
                  fill
                  priority
                  quality={82}
                  sizes="(max-width: 1024px) calc(100vw - 2.5rem), 42vw"
                  className="object-cover"
                  style={{
                    objectPosition: content.heroImage.objectPosition ?? "center center",
                  }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,39,33,0.14),rgba(48,39,33,0.34)_46%,rgba(48,39,33,0.84))]" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_bottom_left,rgba(48,39,33,0.72),rgba(48,39,33,0.18)_58%,transparent_78%)]" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-ivory sm:p-8">
                  <p className="eyebrow-label text-gold/80">What makes it premium</p>
                  <p className="mt-4 max-w-[28rem] font-serif text-3xl leading-tight tracking-[-0.04em] sm:text-[2.35rem]">
                    {content.heroStatement}
                  </p>
                </div>
              </div>
            </div>
            <div className="luxury-panel p-6 sm:p-7">
              <p className="text-sm leading-7 text-charcoal/70">
                {content.availabilityNote}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <SectionHeading
            eyebrow={content.shortTitle}
            title="What to expect"
            description="Helpful details to know before requesting a custom quote."
          />
          <div className="grid gap-4">
            {content.detailBullets.map((bullet) => (
              <div
                key={bullet}
                className="luxury-panel rounded-[1.75rem] px-6 py-6"
              >
                <p className="text-base leading-8 text-charcoal/72">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-charcoal/8 bg-paper py-16 md:py-20">
        <div className="section-shell">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_auto] lg:items-end">
            <SectionHeading
              eyebrow="More examples"
              title={`See more ${content.shortTitle.toLowerCase()} work.`}
              description="A closer look at recent Sweet Fork orders in this category."
            />
            <Link
              href={galleryHref}
              className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full border border-charcoal/12 bg-white px-5 text-sm font-semibold uppercase tracking-[0.14em] text-charcoal shadow-soft transition hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
            >
              View the full gallery
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {hasShowcaseItems ? (
            <div
              className="-mx-5 mt-8 flex snap-x gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-4"
              aria-label={`${content.shortTitle} example photos`}
              role="list"
            >
              {showcaseItems.map((item, index) => (
                <article
                  key={item.id}
                  className="group w-[72vw] max-w-[18rem] shrink-0 snap-start overflow-hidden rounded-[1.55rem] border border-charcoal/8 bg-white shadow-soft transition hover:-translate-y-1 hover:border-gold/24 sm:w-[18rem] lg:w-auto lg:max-w-none"
                  role="listitem"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
                    <Image
                      src={item.imageUrl ?? ""}
                      alt={item.alt}
                      fill
                      quality={82}
                      sizes="(max-width: 640px) 72vw, (max-width: 1024px) 18rem, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      style={{
                        objectPosition: item.objectPosition ?? "center center",
                      }}
                      priority={index < 2}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,39,33,0.02),rgba(48,39,33,0.12)_58%,rgba(48,39,33,0.58))]" />
                    <span className="absolute bottom-3 left-3 rounded-full border border-white/16 bg-charcoal/72 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ivory">
                      {item.category}
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-1 font-serif text-xl leading-tight tracking-[-0.025em] text-charcoal">
                      {item.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-6 text-charcoal/66">{item.alt}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[1.75rem] border border-charcoal/10 bg-white px-6 py-6 shadow-soft sm:px-7">
              <p className="max-w-2xl text-base leading-8 text-charcoal/70">
                Browse the full Sweet Fork gallery for more recent cakes, cookies,
                cupcakes, macarons, and seasonal work.
              </p>
              <Link
                href={galleryHref}
                className="mt-4 inline-flex text-sm font-semibold uppercase tracking-[0.16em] text-charcoal transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
              >
                Browse the full gallery
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-charcoal/8 bg-cream/70 py-16 md:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <SectionHeading
            eyebrow="Pricing Guide"
            title="A simple investment starting point."
            description="The Sweet Fork quotes each order individually, but this gives you a confident place to begin."
          />
          <div className="luxury-panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-charcoal/8 px-6 py-5">
              <p className="eyebrow-label">Starting price</p>
              <h2 className="mt-3 font-serif text-5xl leading-none tracking-[-0.05em] text-charcoal">
                {content.startingPriceLabel}
              </h2>
            </div>
            <div className="space-y-4 px-6 py-6">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-charcoal/62">
                {content.pricingNote}
              </p>
              <p className="text-base leading-8 text-charcoal/68">{content.pricingContext}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions before you reach out."
            description="A quick answer to the timing, customization, delivery, and planning questions that come up most often."
          />
          <div className="space-y-4">
            {content.faq.map((item) => (
              <article
                key={item.question}
                className="luxury-panel rounded-[1.75rem] px-6 py-6"
              >
                <h3 className="text-lg font-medium text-charcoal">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-charcoal/68">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <InquiryCta
        slug={content.slug}
        title={`Ready to inquire about ${content.shortTitle.toLowerCase()}?`}
        description="Share your date, dessert needs, and design direction, and The Sweet Fork will guide the next steps."
      />

      <StickyProductCta
        href={cta.href}
        label={cta.label}
        subtext={cta.subtext}
        analyticsEvent={
          content.slug === "wedding-cakes"
            ? "wedding_consultation_started"
            : "product_cta_clicked"
        }
        analyticsParams={{
          cta_location: "product_sticky_cta",
          page_path: `/${content.slug}`,
          product_category: productCategory,
          product_slug: content.slug,
        }}
      />
    </div>
  );
}
