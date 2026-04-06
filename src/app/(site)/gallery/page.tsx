import { GalleryGrid } from "@/components/site/gallery-grid";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getGalleryItemsForPlacement } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Gallery",
  description: "Browse The Sweet Fork gallery for custom cakes, cupcakes, macarons, cookies, and dessert details from recent orders.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const galleryItems = await getGalleryItemsForPlacement("gallery.grid");

  return (
    <div>
      <PublicPageHero
        eyebrow="Gallery"
        title="Custom cakes and treats from recent Sweet Fork work."
        description="Browse celebration cakes, wedding details, cupcakes, macarons, sugar cookies, and seasonal kits from the bakery's portfolio."
        accent="Based in Centerville and serving celebrations across Davis County, Salt Lake County, and Weber County."
      />
      <section className="section-shell py-16 md:py-20">
        <GalleryGrid items={galleryItems} />
      </section>
      <InquiryCta />
    </div>
  );
}
