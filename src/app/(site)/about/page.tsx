import Image from "next/image";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { getAboutPageData, getGalleryItemsForPlacement } from "@/lib/site/marketing";
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
  const founderPhotos = await getGalleryItemsForPlacement("about.founder.photo", {
    limit: 1,
    requireExplicit: true,
  });
  const founderPhoto = founderPhotos[0] ?? null;

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
        <div className="overflow-hidden rounded-[2rem] border border-charcoal/8 bg-charcoal text-ivory shadow-soft">
          {founderPhoto ? (
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-charcoal/20">
              <Image
                src={founderPhoto.imageUrl ?? ""}
                alt={founderPhoto.alt || "Melissa, the baker behind The Sweet Fork"}
                fill
                quality={82}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                className="object-cover"
                style={{
                  objectPosition: founderPhoto.objectPosition ?? "center center",
                }}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
            </div>
          ) : (
            /* Founder/kitchen photo-ready area. No stock or AI people imagery is used;
               this brand-styled panel gracefully supports a real founder photo when one is added. */
            <div className="relative flex min-h-[15rem] items-end bg-[radial-gradient(circle_at_top_right,rgba(184,150,92,0.22),transparent_55%),linear-gradient(150deg,rgba(44,36,27,0.0),rgba(0,0,0,0.28))] p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <p className="font-serif text-3xl leading-none tracking-[-0.03em] text-ivory/90">
                The Sweet Fork
              </p>
            </div>
          )}
          <div className="border-t border-white/10 p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gold/70">{data.settings.studioEyebrow}</p>
            <p className="mt-5 font-serif text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">
              {data.settings.studioQuote}
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-ivory/70">
              — Melissa, The Sweet Fork
            </p>
          </div>
        </div>
        <div className="space-y-5 text-base leading-8 text-charcoal/72">
          {data.items.map((item) => (
            <p key={item.text}>{item.text}</p>
          ))}
        </div>
      </section>
      <InquiryCta
        title="If The Sweet Fork style feels like the right fit, the next step is easy."
        description="Submit the inquiry with your date, dessert needs, and design direction, and The Sweet Fork will guide the rest from there."
      />
    </div>
  );
}
