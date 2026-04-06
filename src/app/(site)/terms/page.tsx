import { PublicPageHero } from "@/components/site/public-page-hero";
import { termsSections } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Terms",
    description:
      "Order policies, lead times, payment terms, pickup, delivery, and bakery terms for The Sweet Fork.",
    path: "/terms",
  });
}

export default function TermsPage() {
  return (
    <div>
      <PublicPageHero
        eyebrow="Terms"
        title="Policies, lead times, and order terms."
        description="These terms summarize the current ordering, payment, pickup, delivery, allergen, and design policies reflected on the live Sweet Fork site."
      />
      <section className="section-shell space-y-8 py-16 md:py-20">
        {termsSections.map((section) => (
          <article
            key={section.title}
            className="rounded-[1.8rem] border border-charcoal/8 bg-white p-6 shadow-soft"
          >
            <h2 className="font-serif text-3xl tracking-[-0.03em] text-charcoal">
              {section.title}
            </h2>
            <div className="mt-4 space-y-3">
              {section.points.map((point) => (
                <p key={point} className="max-w-4xl text-base leading-8 text-charcoal/72">
                  {point}
                </p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
