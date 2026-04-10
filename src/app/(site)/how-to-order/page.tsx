import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { processSteps } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "How to Order",
    description:
      "Learn how The Sweet Fork inquiry, quote, deposit, pickup, and delivery process works.",
    path: "/how-to-order",
  });
}

export default function HowToOrderPage() {
  const defaultCta = getInquiryCtaBySlug();

  return (
    <div>
      <PublicPageHero
        eyebrow="How to order"
        title="A calm, inquiry-first process from first details to final confirmation."
        description="The Sweet Fork keeps the process simple: share the celebration details, receive a quote tailored to the event, then reserve the date once everything feels right."
        accent="Most custom orders require about 2 weeks notice. Wedding cakes are best submitted 4 to 6 weeks ahead."
        cta={defaultCta}
      />
      <section className="section-shell space-y-4 py-16 md:py-20">
        {processSteps.map((item) => (
          <article key={item.step} className="luxury-panel grid gap-4 rounded-[1.8rem] p-6 md:grid-cols-[auto_1fr_auto] md:items-start">
            <p className="font-serif text-5xl tracking-[-0.05em] text-gold">{item.step}</p>
            <div>
              <h2 className="text-xl font-medium text-charcoal">{item.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-charcoal/68">{item.description}</p>
            </div>
            <p className="text-sm leading-7 text-charcoal/64">
              {item.step === "01"
                ? "Event type, date, dessert needs, pickup or delivery, and inspiration if you have it"
                : item.step === "02"
                  ? "Quote, timing confirmation, and the next details Sweet Fork needs to move forward"
                  : "Deposit to secure the date, then final planning before pickup or delivery"}
            </p>
          </article>
        ))}
      </section>
      <InquiryCta
        title="Ready to begin with the details Sweet Fork needs most?"
        description="The inquiry form keeps the process efficient without losing the custom guidance that makes a boutique order feel personal."
      />
    </div>
  );
}
