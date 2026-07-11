import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { processSteps } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "How to Order",
    description:
      "Learn how Melissa reviews each Sweet Fork inquiry and guides the custom quote, deposit, pickup, and local delivery process.",
    path: "/how-to-order",
  });
}

export default function HowToOrderPage() {
  const defaultCta = getInquiryCtaBySlug();

  return (
    <div>
      <PublicPageHero
        eyebrow="How to order"
        title="A clear, personal process from first details to pickup or delivery."
        description="Ordering begins with a guided inquiry rather than instant checkout. Share your date, dessert needs, guest count, pickup or delivery preference, and inspiration. Melissa reviews each request and follows up with availability, a custom quote, and clear next steps."
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
                  ? "Availability, custom pricing, and the next details Melissa needs to move forward"
                  : "A 50% non-refundable deposit secures the date; an inquiry alone does not reserve it"}
            </p>
          </article>
        ))}
      </section>
      <InquiryCta
        title="Ready to share your celebration details?"
        description="The guided inquiry gives Melissa the date, quantities, budget, and inspiration needed to review availability and prepare an accurate custom quote."
      />
    </div>
  );
}
