import Link from "next/link";

import { GalleryGrid } from "@/components/site/gallery-grid";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { InquiryCtaLink } from "@/components/site/inquiry-cta-link";
import { Badge } from "@/components/ui/badge";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { getGalleryItemsForPlacement } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Cake & Cookie Gallery in Davis County",
    description:
      "Browse The Sweet Fork gallery for custom cakes, cupcakes, macarons, cookies, and dessert details from recent orders.",
    path: "/gallery",
  });
}

export default async function GalleryPage() {
  const galleryItems = await getGalleryItemsForPlacement("gallery.grid");
  const defaultCta = getInquiryCtaBySlug();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-charcoal/8 bg-paper">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9 lg:py-11">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_auto] lg:items-end lg:gap-10">
            <div className="space-y-4 section-reveal">
              <Badge>Gallery</Badge>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-balance font-serif text-4xl leading-[0.98] tracking-[-0.035em] text-charcoal sm:text-5xl lg:text-6xl lg:tracking-[-0.05em]">
                  Custom cakes and desserts created for recent celebrations.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-charcoal/74 sm:text-lg">
                  Explore custom cakes, decorated sugar cookies, and dessert-table
                  details made in Centerville for Davis County celebrations.
                </p>
              </div>
            </div>
            <div className="section-reveal max-w-md rounded-[1.7rem] border border-charcoal/10 bg-white/70 px-5 py-4 shadow-soft lg:max-w-sm">
              <p className="eyebrow-label">Centerville, Utah</p>
              <p className="mt-2 text-sm leading-6 text-charcoal/68">
                Serving Davis, Salt Lake, and nearby Weber County celebrations.
              </p>
              <InquiryCtaLink
                href={defaultCta.href}
                ctaLocation="gallery_hero"
                className="mt-4 inline-flex text-sm font-semibold uppercase tracking-[0.16em] text-charcoal transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
              >
                {defaultCta.label}
              </InquiryCtaLink>
            </div>
          </div>
        </div>
      </section>
      <section className="section-shell pb-14 pt-5 sm:pt-7 md:pb-18 md:pt-8">
        <h2 className="sr-only">Recent cakes and desserts</h2>
        <GalleryGrid items={galleryItems} priorityCount={1} />
      </section>
      <section className="border-y border-charcoal/8 bg-cream/55 py-12 sm:py-16" aria-labelledby="gallery-directions">
        <div className="section-shell">
          <h2 id="gallery-directions" className="font-serif text-4xl leading-tight tracking-[-0.03em] text-charcoal">
            Find a starting point for your celebration.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-charcoal/70">
            A gallery design is inspiration for your own order. Explore the options below,
            then share the details you love. Pickup is in Centerville, with select delivery
            for celebrations in Bountiful, Farmington, Kaysville, and nearby communities.
          </p>
          <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/custom-cakes", title: "Custom cakes", detail: "Buttercream finishes, playful details, and personal touches for birthdays, showers, and milestones." },
              { href: "/wedding-cakes", title: "Wedding cakes", detail: "Refined finishes and thoughtful details shaped around your wedding colors and celebration." },
              { href: "/sugar-cookies", title: "Decorated sugar cookies", detail: "Coordinated colors and designs for favors, gifting, and a place on the dessert table." },
              { href: "/cupcakes", title: "Cupcakes", detail: "Individual treats with buttercream details that tie the dessert table together." },
              { href: "/macarons", title: "Macarons", detail: "Small bites and coordinated color palettes for celebrations and thoughtful gifts." },
              { href: "/diy-kits", title: "DIY decorating kits", detail: "A hands-on decorating activity to share with family, friends, or party guests." },
            ].map((category) => (
              <div key={category.href} className="border-t border-charcoal/12 pt-5">
                <h3 className="font-serif text-2xl text-charcoal">
                  <Link href={category.href} className="underline decoration-gold/50 underline-offset-4 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/60">
                    {category.title}
                  </Link>
                </h3>
                <p className="mt-3 text-sm leading-7 text-charcoal/70">{category.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <InquiryCta
        title="Have a direction in mind after browsing?"
        description="Share the event details, product mix, and inspiration that feels closest to your celebration, and I'll take it from there."
        showEyebrow={false}
        showSubtext={false}
        showUrgencyNote={false}
      />
    </div>
  );
}
