import { StartOrderWizard } from "@/components/inquiry/start-order-wizard";
import { Badge } from "@/components/ui/badge";
import { getStartOrderPageData } from "@/lib/inquiries/catalog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Start Order",
  description:
    "Submit an order inquiry for custom cakes, wedding cakes, cupcakes, sugar cookies, macarons, and DIY kits in Centerville, Utah.",
  path: "/start-order",
});

export const dynamic = "force-dynamic";

export default async function StartOrderPage() {
  const pageData = await getStartOrderPageData();

  return (
    <div className="pb-6 pt-8 sm:pt-10">
      <section className="section-shell pb-8">
        <div className="grain-surface overflow-hidden rounded-[2.8rem] border border-charcoal/10 bg-paper px-6 py-10 shadow-soft sm:px-8 sm:py-12 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
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
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Options
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  {pageData.catalog.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  Custom cakes, wedding cakes, and treats available through one inquiry.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Response
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  24-48 hrs
                </p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  Most inquiries are reviewed personally within 24 to 48 hours.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Lead time
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  2 weeks
                </p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  Most custom orders need at least 2 weeks notice. Wedding cakes usually need 4 to
                  6 weeks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StartOrderWizard {...pageData} />
    </div>
  );
}
