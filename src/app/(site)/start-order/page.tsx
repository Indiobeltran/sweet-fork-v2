import { StartOrderWizard } from "@/components/inquiry/start-order-wizard";
import { getStartOrderPageData } from "@/lib/inquiries/catalog";
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
  const pageData = await getStartOrderPageData();
  const hasCatalog = pageData.catalog.length > 0;

  return (
    <div className="pb-6 pt-8 sm:pt-10">
      <h1 className="sr-only">Start your inquiry</h1>
      {hasCatalog ? (
        <StartOrderWizard {...pageData} />
      ) : (
        <section className="section-shell pb-12">
          <div className="rounded-[2rem] border border-charcoal/10 bg-white px-6 py-8 shadow-soft sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/58">
              Ordering update
            </p>
            <h2 className="mt-3 text-balance font-serif text-4xl tracking-[-0.04em] text-charcoal">
              Online inquiries are temporarily unavailable.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/68">
              The public product list does not currently include any active offerings. Check the
              booking notice above for availability context, or use the contact details in the
              footer if you need to confirm timing directly.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
