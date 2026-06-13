import Image from "next/image";

import { InquiryCta } from "@/components/site/inquiry-cta";
import { SectionHeading } from "@/components/site/section-heading";
import { SitePrimaryCta } from "@/components/site/site-primary-cta";
import { StickyProductCta } from "@/components/site/sticky-product-cta";
import { getPublicEnv } from "@/lib/env";
import { siteConfig } from "@/lib/content/site-content";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import type { ProductPageContent } from "@/types/domain";

type ProductPageTemplateProps = {
  content: ProductPageContent;
};

export function ProductPageTemplate({ content }: ProductPageTemplateProps) {
  const cta = getInquiryCtaBySlug(content.slug);
  const { siteUrl } = getPublicEnv();
  const pageUrl = new URL(`/${content.slug}`, siteUrl).toString();
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
            <SitePrimaryCta href={cta.href} label={cta.label} subtext={cta.subtext} />
          </div>

          <div className="grid gap-4 section-reveal">
            <div className="relative overflow-hidden rounded-[2.4rem] border border-charcoal/12 bg-charcoal shadow-soft">
              <div className="relative min-h-[18rem] sm:min-h-[27rem] lg:min-h-[31rem]">
                <Image
                  src={content.heroImage.src}
                  alt={content.heroImage.alt}
                  fill
                  priority
                  quality={82}
                  sizes="(max-width: 1024px) calc(100vw - 2.5rem), 42vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,39,33,0.02),rgba(48,39,33,0.24)_50%,rgba(48,39,33,0.72))]" />
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
      />
    </div>
  );
}
