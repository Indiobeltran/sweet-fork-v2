import { updateProduct } from "@/app/admin/(protected)/products/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProductAdminData } from "@/lib/admin/site-management";
import { toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Products",
};

type AdminProductsPageProps = {
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

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const [rawSearchParams, products] = await Promise.all([searchParams, getProductAdminData()]);
  const notice = getNoticeValue(rawSearchParams);

  return (
    <div className="space-y-6">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "product-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The product change could not be saved.",
          },
          "product-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Product details updated.",
          },
        }}
      />

      <AdminSectionCard
        title="Product visibility"
        description="This is the calm control layer for what shows up in pricing and the inquiry flow. Slugs and product types stay fixed so page routes do not get accidentally broken."
      >
        <div className="space-y-5">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-[1.8rem] border border-charcoal/10 bg-paper p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/68">
                  {toTitleCase(product.product_type)}
                </span>
                <span className="rounded-full border border-charcoal/10 bg-ivory/80 px-3 py-1 text-xs text-charcoal/66">
                  {product.slug}
                </span>
              </div>

              <form action={updateProduct} className="mt-5 space-y-4">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="redirectTo" value="/admin/products" />

                <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                  <div>
                    <Label htmlFor={`product-name-${product.id}`}>Name</Label>
                    <Input
                      id={`product-name-${product.id}`}
                      name="name"
                      defaultValue={product.name}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`product-order-${product.id}`}>Display order</Label>
                    <Input
                      id={`product-order-${product.id}`}
                      name="displayOrder"
                      type="number"
                      defaultValue={product.display_order}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`product-short-${product.id}`}>Short description</Label>
                  <Input
                    id={`product-short-${product.id}`}
                    name="shortDescription"
                    defaultValue={product.short_description ?? ""}
                  />
                </div>

                <div>
                  <Label htmlFor={`product-long-${product.id}`}>Long description</Label>
                  <Textarea
                    id={`product-long-${product.id}`}
                    name="longDescription"
                    defaultValue={product.long_description ?? ""}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ToggleField
                    defaultChecked={product.requires_consultation}
                    label="Consultation recommended for this product"
                    name="requiresConsultation"
                  />
                  <ToggleField
                    defaultChecked={product.is_active}
                    label="Show this product in pricing and inquiries"
                    name="isActive"
                  />
                </div>

                <Button type="submit">Save product</Button>
              </form>
            </article>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
