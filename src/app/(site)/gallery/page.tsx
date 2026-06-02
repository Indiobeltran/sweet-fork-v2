import { GalleryGrid } from "@/components/site/gallery-grid";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { Badge } from "@/components/ui/badge";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { getGalleryItemsForPlacement } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Gallery",
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
                  Browse The Sweet Fork work across birthdays, weddings, showers, gifting
                  moments, and dessert tables.
                </p>
              </div>
            </div>
            <div className="section-reveal max-w-md rounded-[1.7rem] border border-charcoal/10 bg-white/70 px-5 py-4 shadow-soft lg:max-w-sm">
              <p className="eyebrow-label">Centerville, Utah</p>
              <p className="mt-2 text-sm leading-6 text-charcoal/68">
                Serving Davis, Salt Lake, and nearby Weber County celebrations.
              </p>
              <a
                href={defaultCta.href}
                className="mt-4 inline-flex text-sm font-semibold uppercase tracking-[0.16em] text-charcoal transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
              >
                {defaultCta.label}
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="section-shell pb-14 pt-5 sm:pt-7 md:pb-18 md:pt-8">
        <GalleryGrid items={galleryItems} priorityCount={6} />
      </section>
      <InquiryCta
        title="Have a direction in mind after browsing?"
        description="Share the event details, product mix, and inspiration that feels closest to your celebration, and The Sweet Fork will take it from there."
      />
    </div>
  );
}
