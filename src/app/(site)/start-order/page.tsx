import { StartOrderWizard } from "@/components/inquiry/start-order-wizard";
import { getStartOrderPageData } from "@/lib/inquiries/catalog";
import { getGalleryInquiryContext } from "@/lib/inquiries/gallery-context";
import { getGalleryItemsForPlacement } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Start Your Inquiry",
    description:
      "Submit an order inquiry for custom cakes, wedding cakes, cupcakes, sugar cookies, macarons, and DIY kits in Centerville, Utah.",
    path: "/start-order",
  });
}

export const dynamic = "force-dynamic";

export default async function StartOrderPage() {
  const [pageData, galleryItems] = await Promise.all([
    getStartOrderPageData(),
    getGalleryItemsForPlacement("gallery.grid"),
  ]);
  const galleryContexts = galleryItems.flatMap((item) => {
    const context = getGalleryInquiryContext(item);
    return context && pageData.catalog.some((product) => product.productType === context.productType)
      ? [context]
      : [];
  });

  return (
    <div className="pb-6 pt-5 sm:pt-10">
      <h1 className="sr-only">Start your inquiry</h1>
      <StartOrderWizard {...pageData} galleryContexts={galleryContexts} />
    </div>
  );
}
