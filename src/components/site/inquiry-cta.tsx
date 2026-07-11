import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { SitePrimaryCta } from "@/components/site/site-primary-cta";
import { getProductCategory } from "@/lib/analytics/events";

type InquiryCtaProps = {
  slug?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  urgencyNote?: string;
};

export function InquiryCta({
  slug,
  eyebrow = "Limited availability",
  title = "Reserve a place on The Sweet Fork calendar before your date fills.",
  description = "Share the event details, dessert needs, and overall design direction in one guided inquiry. Most replies are sent within 24 to 48 hours with quote-ready next steps.",
  urgencyNote = "Dates around weddings, holidays, and peak weekends tend to book first.",
}: InquiryCtaProps) {
  const cta = getInquiryCtaBySlug(slug);
  const productCategory = slug ? getProductCategory(slug) : undefined;

  return (
    <section
      id="product-final-cta"
      className="relative overflow-hidden border-t border-gold/12 bg-[linear-gradient(135deg,rgb(var(--color-charcoal)),rgba(44,36,27,0.94))] px-5 py-16 text-ivory sm:px-8 md:py-20"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold/70">{eyebrow}</p>
          <h2 className="max-w-3xl text-balance font-serif text-4xl leading-[0.96] sm:text-5xl">
            {title}
          </h2>
        </div>
        <div className="space-y-5">
          <p className="max-w-xl text-sm leading-7 text-ivory/72">{description}</p>
          <SitePrimaryCta
            href={cta.href}
            label={cta.label}
            subtext={cta.subtext}
            buttonClassName="bg-ivory text-charcoal hover:bg-white sm:w-full"
            analyticsEvent={
              slug === "wedding-cakes"
                ? "wedding_consultation_started"
                : "product_cta_clicked"
            }
            analyticsParams={{
              cta_location: slug ? "product_final_cta" : "site_final_cta",
              ...(productCategory ? { product_category: productCategory } : {}),
              ...(slug ? { page_path: `/${slug}`, product_slug: slug } : {}),
            }}
          />
          <p className="text-sm leading-7 text-ivory/66">
            {urgencyNote}
          </p>
        </div>
      </div>
    </section>
  );
}
