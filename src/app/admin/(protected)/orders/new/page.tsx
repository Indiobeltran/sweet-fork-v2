import { createManualOrder } from "@/app/admin/(protected)/orders/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { StatusChipRow } from "@/components/admin/status-chip-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getManualOrderFormData } from "@/lib/admin/orders";

export const metadata = {
  title: "Add Manual Order",
};

type NewManualOrderPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function getModeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const modeValue = rawSearchParams.mode;
  const mode = Array.isArray(modeValue) ? modeValue[0] : modeValue;

  return mode === "quick" ? "quick" : "full";
}

function FieldCard({
  children,
  className = "",
  htmlFor,
  label,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  label: string;
}>) {
  return (
    <div className={`rounded-[1.35rem] border border-charcoal/8 bg-paper/80 p-4 ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export default async function NewManualOrderPage({ searchParams }: NewManualOrderPageProps) {
  const [rawSearchParams, data] = await Promise.all([
    searchParams,
    getManualOrderFormData(),
  ]);
  const notice = getNoticeValue(rawSearchParams);
  const mode = getModeValue(rawSearchParams);
  const firstProduct = data.productOptions[0];

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "manual-order-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The manual order could not be created. Please review the fields and try again.",
          },
          "manual-order-amount-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "Order total must be greater than $0, and amount paid cannot be negative or exceed the total.",
          },
        }}
      />

      <AdminPageHeader
        hideTitleOnMobile
        title="Add manual order"
        description="Create a confirmed order without starting from an inquiry. Keep this for phone, text, or in-person bookings."
      >
        <StatusChipRow
          ariaLabel="Manual order mode"
          items={[
            {
              href: "/admin/orders/new",
              isActive: mode === "full",
              label: "Full form",
            },
            {
              href: "/admin/orders/new?mode=quick",
              isActive: mode === "quick",
              label: "Quick add",
            },
          ]}
        />
      </AdminPageHeader>

      <AdminSectionCard
        title={mode === "quick" ? "Quick add" : "Order details"}
        description={
          mode === "quick"
            ? "Backfill an existing order with just the essentials. Contact details can be added later."
            : "Save the essentials first. You can add fuller production notes, payments, and fulfillment details from the order record."
        }
      >
        <form action={createManualOrder} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="variant" value={mode} />
          <input type="hidden" name="fallbackProductType" value={firstProduct?.productType ?? "custom-cake"} />

          <FieldCard label="Customer name" htmlFor="manual-customer-name">
            <Input id="manual-customer-name" name="customerName" required placeholder="Melissa Smith" />
          </FieldCard>

          {mode === "full" ? (
            <>
              <FieldCard label="Email" htmlFor="manual-customer-email">
                <Input id="manual-customer-email" name="customerEmail" type="email" placeholder="client@example.com" />
              </FieldCard>

              <FieldCard label="Phone" htmlFor="manual-customer-phone">
                <Input id="manual-customer-phone" name="customerPhone" type="tel" placeholder="801-555-0123" />
              </FieldCard>
            </>
          ) : null}

          <FieldCard label="Occasion" htmlFor="manual-event-type">
            <Input id="manual-event-type" name="eventType" required placeholder="Birthday, wedding, pickup order" />
          </FieldCard>

          <FieldCard label="Due date" htmlFor="manual-event-date">
            <Input id="manual-event-date" name="eventDate" required type="date" />
          </FieldCard>

          <FieldCard label="Fulfillment" htmlFor="manual-fulfillment">
            <Select id="manual-fulfillment" name="fulfillmentMethod" defaultValue="pickup">
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </Select>
          </FieldCard>

          {mode === "full" ? (
            <FieldCard label="Product" htmlFor="manual-product">
              <Select
                id="manual-product"
                name="productId"
                defaultValue={firstProduct?.id ?? ""}
                required
              >
                {data.productOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.label}
                  </option>
                ))}
              </Select>
            </FieldCard>
          ) : (
            <FieldCard label="Item description" htmlFor="manual-item-description" className="lg:col-span-2">
              <Textarea
                id="manual-item-description"
                name="itemDescription"
                required
                placeholder="6-inch vanilla cake with raspberry filling"
              />
            </FieldCard>
          )}

          <FieldCard label="Order total" htmlFor="manual-total-amount">
            <Input id="manual-total-amount" name="totalAmount" required inputMode="decimal" placeholder="240" />
          </FieldCard>

          {mode === "quick" ? (
            <FieldCard label="Amount paid" htmlFor="manual-amount-paid">
              <Input id="manual-amount-paid" name="amountPaid" required inputMode="decimal" placeholder="0" />
            </FieldCard>
          ) : (
            <FieldCard label="Deposit due" htmlFor="manual-deposit-due">
              <Input id="manual-deposit-due" name="depositDueAmount" inputMode="decimal" placeholder="Optional" />
            </FieldCard>
          )}

          {mode === "quick" ? (
            <>
              <FieldCard label="Email" htmlFor="manual-customer-email">
                <Input id="manual-customer-email" name="customerEmail" type="email" placeholder="Optional" />
              </FieldCard>
              <FieldCard label="Phone" htmlFor="manual-customer-phone">
                <Input id="manual-customer-phone" name="customerPhone" type="tel" placeholder="Optional" />
              </FieldCard>
            </>
          ) : (
            <FieldCard label="Internal note" htmlFor="manual-internal-summary" className="lg:col-span-2">
              <Textarea
                id="manual-internal-summary"
                name="internalSummary"
                placeholder="Flavor, pickup window, design details, or where the order came from."
              />
            </FieldCard>
          )}

          <div className="flex justify-end lg:col-span-2">
            <Button type="submit" disabled={data.productOptions.length === 0}>
              {mode === "quick" ? "Quick add order" : "Create order"}
            </Button>
          </div>
        </form>
      </AdminSectionCard>
    </div>
  );
}
