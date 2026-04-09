import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { getAboutPageData } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "About",
    description:
      "Learn about The Sweet Fork, a small custom bakery in Centerville, Utah specializing in handcrafted cakes, cupcakes, macarons, and decorated cookies.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const data = await getAboutPageData();
  const defaultCta = getInquiryCtaBySlug();

  return (
    <div>
      <PublicPageHero
        eyebrow={data.eyebrow}
        title={data.heading}
        description={data.body}
        accent={data.settings.accent}
        cta={defaultCta}
      />
      <section className="section-shell grid gap-8 py-16 md:py-20 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-charcoal/8 bg-charcoal p-8 text-ivory shadow-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-gold/70">{data.settings.studioEyebrow}</p>
          <p className="mt-6 font-serif text-4xl leading-tight tracking-[-0.04em]">
            {data.settings.studioQuote}
          </p>
        </div>
        <div className="space-y-5 text-base leading-8 text-charcoal/72">
          {data.items.map((item) => (
            <p key={item.text}>{item.text}</p>
          ))}
        </div>
      </section>
      <InquiryCta
        title="If the Sweet Fork style feels like the right fit, the next step is easy."
        description="Submit the inquiry with your date, dessert needs, and design direction, and Sweet Fork will guide the rest from there."
      />
    </div>
  );
}
