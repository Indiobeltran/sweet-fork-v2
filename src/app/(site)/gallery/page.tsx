import { GalleryGrid } from "@/components/site/gallery-grid";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { galleryItems } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Gallery",
  description: "Browse The Sweet Fork gallery for celebration cakes, wedding cakes, cupcakes, cookies, macarons, and dessert-table styling.",
  path: "/gallery",
});

export default function GalleryPage() {
  return (
    <div>
      <PublicPageHero
        eyebrow="Gallery"
        title="A gallery built to feel like a boutique grid, not a bakery catalog."
        description="The live image library will eventually be admin-managed through Supabase storage, but the page structure is already prepared for that workflow."
        accent="Warm neutrals, sculpted finishes, and detail that reads beautifully in person and on camera."
      />
      <section className="section-shell py-16 md:py-20">
        <GalleryGrid items={galleryItems} />
      </section>
      <InquiryCta />
    </div>
  );
}
