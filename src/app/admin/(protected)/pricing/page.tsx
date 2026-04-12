import { upsertProductPricing } from "@/app/admin/(protected)/pricing/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPricingAdminData } from "@/lib/admin/site-management";
import { toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Pricing",
};

type AdminPricingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function ToggleField({
  defaultChecked,
  label,
  name,
}: Readonly<{
  defaultChecked: boolean;
  label: string;
  name: string;
}>) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-ivory/55 px-4 py-3 text-sm text-charcoal/74">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
      />
      <span>{label}</span>
    </label>
  );
}

export default async function AdminPricingPage({ searchParams }: AdminPricingPageProps) {
  const [rawSearchParams, products] = await Promise.all([searchParams, getPricingAdminData()]);
  const notice = getNoticeValue(rawSearchParams);

  return (
    <div className="space-y-4">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "pricing-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The pricing change could not be saved.",
          },
          "pricing-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Pricing updated.",
          },
        }}
      />

      <AdminSectionCard
        title="Pricing display"
        description="This keeps pricing practical: edit the current display ranges without turning on the more advanced pricing-rules system yet."
      >
        <div className="space-y-5">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-[1.8rem] border border-charcoal/10 bg-paper p-5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    {toTitleCase(product.productType)}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                    {product.name}
                  </h2>
                </div>

                <div className="rounded-[1.5rem] border border-charcoal/10 bg-white/80 px-4 py-3 text-sm text-charcoal/68">
                  Starting at <span className="font-medium text-charcoal">{product.startingAtLabel}</span>
                </div>
              </div>

              <form action={upsertProductPricing} className="mt-5 space-y-5">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="productType" value={product.productType} />
                <input type="hidden" name="redirectTo" value="/admin/pricing" />

                <div className="grid gap-4 xl:grid-cols-2">
                  {product.prices.map((price) => (
                    <div
                      key={`${product.id}-${price.kind}`}
                      className="rounded-[1.5rem] border border-charcoal/10 bg-white px-4 py-4"
                    >
                      <input type="hidden" name={`priceId.${price.kind}`} value={price.id ?? ""} />

                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                        {toTitleCase(price.kind)}
                      </p>

                      <div className="mt-4 grid gap-4">
                        <div>
                          <Label htmlFor={`${product.id}-${price.kind}-label`}>Label</Label>
                          <Input
                            id={`${product.id}-${price.kind}-label`}
                            name={`label.${price.kind}`}
                            defaultValue={price.label}
                            required
                          />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <Label htmlFor={`${product.id}-${price.kind}-min`}>Minimum</Label>
                            <Input
                              id={`${product.id}-${price.kind}-min`}
                              name={`minimumAmount.${price.kind}`}
                              type="number"
                              step="0.01"
                              defaultValue={price.minimumAmount}
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor={`${product.id}-${price.kind}-max`}>Maximum</Label>
                            <Input
                              id={`${product.id}-${price.kind}-max`}
                              name={`maximumAmount.${price.kind}`}
                              type="number"
                              step="0.01"
                              defaultValue={price.maximumAmount ?? price.minimumAmount}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`${product.id}-${price.kind}-unit`}>Unit label</Label>
                          <Input
                            id={`${product.id}-${price.kind}-unit`}
                            name={`unitLabel.${price.kind}`}
                            defaultValue={price.unitLabel ?? ""}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`${product.id}-${price.kind}-notes`}>Display note</Label>
                          <Textarea
                            id={`${product.id}-${price.kind}-notes`}
                            name={`notes.${price.kind}`}
                            defaultValue={price.notes ?? ""}
                          />
                        </div>

                        <ToggleField
                          defaultChecked={price.isActive}
                          label="Use this price row in the current pricing view"
                          name={`isActive.${price.kind}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit">Save pricing for {product.name}</Button>
              </form>
            </article>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
