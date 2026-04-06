import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { processSteps } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How to Order",
  description: "Learn how The Sweet Fork inquiry, quote, deposit, pickup, and delivery process works.",
  path: "/how-to-order",
});

export default function HowToOrderPage() {
  return (
    <div>
      <PublicPageHero
        eyebrow="How to order"
        title="Inquiry, quote, deposit, then your order is reserved."
        description="Start with the order form, and The Sweet Fork usually replies within 24 to 48 hours with a detailed quote based on the event, design, and servings."
        accent="Most custom orders require 2 weeks notice. Wedding cakes usually need 4 to 6 weeks."
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
                ? "Event type, date, guest count, pickup or delivery, and overall budget range"
                : item.step === "02"
                  ? "Detailed quote, design notes, flavors, quantities, and any rush-order considerations"
                  : "50% deposit to secure the date, then final balance before pickup or delivery"}
            </p>
          </article>
        ))}
      </section>
      <InquiryCta />
    </div>
  );
}
