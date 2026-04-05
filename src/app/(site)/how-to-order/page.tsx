import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { processSteps } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How to Order",
  description: "Learn how The Sweet Fork inquiry, review, quoting, and fulfillment process works.",
  path: "/how-to-order",
});

export default function HowToOrderPage() {
  return (
    <div>
      <PublicPageHero
        eyebrow="How to order"
        title="A more guided process from inquiry to fulfilled order."
        description="The system is designed to collect the event vision, product selections, inspiration, and logistics at the beginning so quotes move faster and with more context."
        accent="Better intake means better-fit inquiries, fewer scattered follow-up emails, and cleaner handoff into production."
      />
      <section className="section-shell space-y-4 py-16 md:py-20">
        {processSteps.map((item) => (
          <article key={item.step} className="grid gap-4 rounded-[1.8rem] border border-charcoal/8 bg-white p-6 shadow-soft md:grid-cols-[auto_1fr_auto] md:items-start">
            <p className="font-serif text-5xl tracking-[-0.05em] text-gold">{item.step}</p>
            <div>
              <h2 className="text-xl font-medium text-charcoal">{item.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-charcoal/68">{item.description}</p>
            </div>
            <p className="text-sm leading-7 text-charcoal/52">
              {item.step === "01"
                ? "Event details, budget range, guest count, date, and fulfillment method"
                : item.step === "02"
                  ? "Multiple items, product-specific details, images, links, and notes"
                  : "Internal summary, estimate range, quote follow-up, scheduling, and payment workflow"}
            </p>
          </article>
        ))}
      </section>
      <InquiryCta />
    </div>
  );
}
