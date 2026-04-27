import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { getPublicFaqItems } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "FAQ",
    description:
      "Common questions about ordering, pricing, delivery, policies, and lead times for The Sweet Fork in Centerville, Utah.",
    path: "/faq",
  });
}

export default async function FaqPage() {
  const faqItems = await getPublicFaqItems();
  const defaultCta = getInquiryCtaBySlug();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicPageHero
        eyebrow="FAQ"
        title="Answers to the questions clients ask before they inquire."
        description="These are the details that most often help with timing, customization, pricing expectations, pickup, and delivery before a quote is requested."
        accent="If anything still feels open-ended, include it in the inquiry and Sweet Fork will address it in the first reply."
        cta={defaultCta}
      />
      <section className="section-shell space-y-4 py-16 md:py-20">
        {faqItems.map((item, index) => (
          <details
            key={item.question}
            className="group luxury-panel rounded-[1.8rem] p-0"
            open={index < 3}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50">
              <h2 className="text-lg font-medium text-charcoal">{item.question}</h2>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-charcoal/10 text-xl leading-none text-charcoal/58 transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="px-6 pb-6 pt-0">
              <p className="max-w-3xl text-sm leading-7 text-charcoal/68">{item.answer}</p>
            </div>
          </details>
        ))}
      </section>
      <InquiryCta
        title="Ready to ask about your own celebration?"
        description="The inquiry form is the simplest way to share your date, dessert needs, and design direction without any commitment to book."
      />
    </div>
  );
}
