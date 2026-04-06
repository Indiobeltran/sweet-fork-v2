import { PublicPageHero } from "@/components/site/public-page-hero";
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
        title="Answers to common ordering, pricing, and policy questions."
        description="These are the questions Sweet Fork customers ask most often before they book a cake, a dessert order, or a pickup or delivery date."
        accent="Still deciding? Start the inquiry form and include anything else you want answered in the first reply."
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
