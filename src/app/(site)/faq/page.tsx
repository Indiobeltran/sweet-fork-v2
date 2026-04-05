import { PublicPageHero } from "@/components/site/public-page-hero";
import { faqItems } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ",
  description: "Answers to common questions about lead times, delivery, pricing, and inquiry details.",
  path: "/faq",
});

export default function FaqPage() {
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
        title="Answers before the inbox conversation even starts."
        description="Clear expectations help everyone move faster, especially when custom work spans several products and moving pieces."
        accent="Thoughtful qualification is part of the brand experience, not just an internal efficiency play."
      />
      <section className="section-shell space-y-4 py-16 md:py-20">
        {faqItems.map((item) => (
          <article key={item.question} className="rounded-[1.8rem] border border-charcoal/8 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-medium text-charcoal">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-charcoal/68">{item.answer}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
