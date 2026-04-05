import Link from "next/link";

import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import type { ProductPageContent } from "@/types/domain";

type ProductPageTemplateProps = {
  content: ProductPageContent;
};

export function ProductPageTemplate({ content }: ProductPageTemplateProps) {
  return (
    <div>
      <PublicPageHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.intro}
        accent={content.heroStatement}
      />

      <section className="section-shell grid gap-12 py-16 md:py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow={content.shortTitle}
          title="What to expect"
          description="A premium order flow that starts with the event context, design direction, and serving plan before moving into final quoting."
        />
        <div className="grid gap-4">
          {content.detailBullets.map((bullet) => (
            <div key={bullet} className="rounded-[1.8rem] border border-charcoal/8 bg-white p-6 shadow-soft">
              <p className="text-base leading-7 text-charcoal/72">{bullet}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-charcoal/8 bg-cream/70 py-16 md:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[1fr_1fr]">
          <SectionHeading
            eyebrow="Starting point"
            title="Design tiers"
            description="Pricing and scope always depend on serving counts, finish complexity, pickup or delivery needs, and calendar fit."
          />
          <div className="grid gap-4">
            {content.packages.map((item) => (
              <div key={item.title} className="rounded-[1.8rem] border border-charcoal/8 bg-white px-6 py-6 shadow-soft">
                <h3 className="font-serif text-3xl tracking-[-0.03em] text-charcoal">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-charcoal/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Questions clients ask"
            title="Before you inquire"
            description="These are the details that help the first conversation start with more clarity and less back-and-forth."
          />
          <div className="space-y-4">
            {content.faq.map((item) => (
              <div key={item.question} className="rounded-[1.8rem] border border-charcoal/8 bg-white px-6 py-6 shadow-soft">
                <h3 className="font-medium text-charcoal">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-charcoal/70">{item.answer}</p>
              </div>
            ))}
            <Link href="/start-order" className="inline-flex pt-2 text-sm font-semibold uppercase tracking-[0.18em] text-charcoal">
              Start the order inquiry
            </Link>
          </div>
        </div>
      </section>

      <InquiryCta />
    </div>
  );
}
