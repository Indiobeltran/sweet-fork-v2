import { StartOrderWizard } from "@/components/inquiry/start-order-wizard";
import { Badge } from "@/components/ui/badge";
import { getStartOrderPageData } from "@/lib/inquiries/catalog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Start Order",
  description:
    "Submit a premium multi-step inquiry for custom cakes, wedding cakes, cupcakes, sugar cookies, macarons, and DIY kits.",
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
              <Badge>Phase 4 Intake</Badge>
              <h1 className="max-w-4xl font-serif text-5xl leading-none tracking-[-0.05em] text-charcoal sm:text-6xl">
                Start the full order inquiry with clarity, detail, and room for design direction.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-charcoal/70">
                This guided flow keeps everything in one polished place: event details, multiple
                product selections, item-specific notes, inspiration uploads, and the final contact
                review before submission.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Products
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  {pageData.catalog.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  Live catalog choices pulled from the current Supabase schema.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Flow
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">5 steps</p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  Guided enough to feel confident, concise enough to finish comfortably.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-white/85 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Inspiration
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  {pageData.featureFlags.uploadsEnabled ? "Uploads on" : "Notes mode"}
                </p>
                <p className="mt-2 text-sm leading-7 text-charcoal/62">
                  Uploads, links, and written notes adapt to the current inquiry feature flags.
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
