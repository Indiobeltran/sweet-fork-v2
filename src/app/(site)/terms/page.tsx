import { PublicPageHero } from "@/components/site/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms",
  description: "Terms and conditions for Sweet Fork inquiries, orders, and fulfillment.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div>
      <PublicPageHero
        eyebrow="Terms"
        title="Order terms and service expectations."
        description="This placeholder legal page is structured for final bakery policy copy and should be reviewed with business-specific language before launch."
      />
      <section className="section-shell space-y-8 py-16 md:py-20">
        {[
          "Orders are not confirmed until availability, scope, and payment terms are approved.",
          "Design references guide the direction but are not replicated exactly.",
          "Pickup and delivery timing, setup needs, and final balance expectations should be confirmed in writing.",
        ].map((item) => (
          <p key={item} className="max-w-3xl text-base leading-8 text-charcoal/72">
            {item}
          </p>
        ))}
      </section>
    </div>
  );
}
