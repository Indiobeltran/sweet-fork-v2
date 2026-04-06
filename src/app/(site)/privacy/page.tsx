import { PublicPageHero } from "@/components/site/public-page-hero";
import { privacySections } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Privacy",
    description:
      "Privacy overview for inquiry submissions, inspiration uploads, and order records at The Sweet Fork.",
    path: "/privacy",
  });
}

export default function PrivacyPage() {
  return (
    <div>
      <PublicPageHero
        eyebrow="Privacy"
        title="How inquiry details and order information are used."
        description="This page covers the information customers submit through the Sweet Fork inquiry flow and how that information supports quoting, fulfillment, and order follow-up."
      />
      <section className="section-shell space-y-8 py-16 md:py-20">
        {privacySections.map((section) => (
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
