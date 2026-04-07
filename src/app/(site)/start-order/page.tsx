import { StartOrderWizard } from "@/components/inquiry/start-order-wizard";
import { Badge } from "@/components/ui/badge";
import { getStartOrderPageData } from "@/lib/inquiries/catalog";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Start Order",
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
    <div className="start-order-page-shell pb-6 pt-8 sm:pt-10">
      <section className="start-order-page-hero section-shell pb-8">
        <div className="grain-surface overflow-hidden rounded-[2.8rem] border border-charcoal/10 bg-paper px-6 py-9 shadow-soft sm:px-8 sm:py-11 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="space-y-4">
              <Badge>Order Inquiry</Badge>
              <h1 className="max-w-4xl font-serif text-5xl leading-none tracking-[-0.05em] text-charcoal sm:text-6xl">
                Start your order inquiry with the details needed for a clear quote.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-charcoal/70">
                Share the event, choose one or several desserts, add inspiration, and The Sweet
                Fork will usually reply within 24 to 48 hours with a detailed quote.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Options
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  {pageData.catalog.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  {hasCatalog
                    ? "Custom cakes, wedding cakes, and treats available through one inquiry."
                    : "Public inquiry options are currently paused while availability is updated."}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  {hasCatalog ? "Response" : "Status"}
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  {hasCatalog ? "24-48 hrs" : "Updated"}
                </p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  {hasCatalog
                    ? "Most inquiries are reviewed personally within 24 to 48 hours."
                    : "The booking notice above reflects the current public availability status."}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  {hasCatalog ? "Lead time" : "Offerings"}
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  {hasCatalog ? "2 weeks" : "Paused"}
                </p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  {hasCatalog
                    ? "Most custom orders need at least 2 weeks notice. Wedding cakes usually need 4 to 6 weeks."
                    : "The public inquiry list does not currently include any active product options."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasCatalog ? (
        <StartOrderWizard {...pageData} />
      ) : (
        <section className="section-shell pb-12">
          <div className="rounded-[2rem] border border-charcoal/10 bg-white px-6 py-8 shadow-soft sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
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
