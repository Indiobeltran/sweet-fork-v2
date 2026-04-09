import { GalleryGrid } from "@/components/site/gallery-grid";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
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
      <PublicPageHero
        eyebrow="Gallery"
        title="A curated look at cakes and desserts created for recent celebrations."
        description="Browse Sweet Fork work across birthdays, weddings, showers, gifting moments, and dessert tables without losing the calm, editorial feel of the brand."
        accent="Based in Centerville and serving celebrations across Davis, Salt Lake, and nearby Weber County communities."
        cta={defaultCta}
      />
      <section className="section-shell py-16 md:py-20">
        <GalleryGrid items={galleryItems} />
      </section>
      <InquiryCta
        title="Have a direction in mind after browsing?"
        description="Share the event details, product mix, and inspiration that feels closest to your celebration, and Sweet Fork will take it from there."
      />
    </div>
  );
}
