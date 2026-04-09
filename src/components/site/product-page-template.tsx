import { InquiryCta } from "@/components/site/inquiry-cta";
import { SectionHeading } from "@/components/site/section-heading";
import { SitePrimaryCta } from "@/components/site/site-primary-cta";
import { StickyProductCta } from "@/components/site/sticky-product-cta";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import type { ProductPageContent } from "@/types/domain";

type ProductPageTemplateProps = {
  content: ProductPageContent;
};

export function ProductPageTemplate({ content }: ProductPageTemplateProps) {
  const cta = getInquiryCtaBySlug(content.slug);

  return (
    <div className="pb-28 md:pb-0">
      <section className="relative overflow-hidden border-b border-charcoal/8 bg-paper">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
        <div className="section-shell grid gap-12 py-14 md:py-18 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-16">
          <div className="space-y-6 section-reveal">
            <p className="eyebrow-label">{content.eyebrow}</p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-balance font-serif text-5xl leading-[0.92] tracking-[-0.05em] text-charcoal sm:text-6xl lg:text-7xl">
                {content.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-charcoal/72 sm:text-lg">
                {content.intro}
              </p>
            </div>
            <SitePrimaryCta href={cta.href} label={cta.label} subtext={cta.subtext} />
          </div>

          <div className="luxury-panel section-reveal p-7 sm:p-8">
            <p className="eyebrow-label">What makes it premium</p>
            <p className="mt-4 font-serif text-3xl leading-tight tracking-[-0.04em] text-charcoal sm:text-[2.35rem]">
              {content.heroStatement}
            </p>
            <p className="mt-6 text-sm leading-7 text-charcoal/64">{content.availabilityNote}</p>
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <SectionHeading
            eyebrow={content.shortTitle}
            title="What to expect"
            description="A clear starting point before you submit your inquiry, so the quote can be tailored without unnecessary back-and-forth."
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
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-charcoal/48">
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
        description="The inquiry form keeps the process streamlined while still leaving room for the details that make your order feel fully considered."
      />

      <StickyProductCta
        href={cta.href}
        label={cta.label}
        subtext={cta.subtext}
      />
    </div>
  );
}
