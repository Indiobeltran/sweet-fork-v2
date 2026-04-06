import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getOrderListData,
  parseOrderListFilters,
  type OrderListEntry,
} from "@/lib/admin/orders";
import {
  getOrderStatusClasses,
  getPaymentStatusClasses,
} from "@/lib/admin/order-workflow";
import { formatDate, toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Orders",
};

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function FilterCard({
  children,
  label,
}: Readonly<{
  children: React.ReactNode;
  label: string;
}>) {
  return (
    <div className="rounded-[1.6rem] border border-charcoal/8 bg-white/85 p-4">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function LinkButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-medium tracking-[0.02em] text-ivory shadow-soft transition hover:bg-charcoal/90"
    >
      {label}
    </Link>
  );
}

function OrderCard({ entry }: { entry: OrderListEntry }) {
  return (
    <article className="rounded-[2rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft transition hover:border-charcoal/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
              {entry.referenceCode}
            </Badge>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getOrderStatusClasses(entry.status)}`}
            >
              {toTitleCase(entry.status)}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getPaymentStatusClasses(entry.paymentState)}`}
            >
              {entry.paymentStateLabel}
            </span>
          </div>

          <div>
            <h2 className="font-serif text-3xl tracking-[-0.03em] text-charcoal">
              {entry.customerLabel}
            </h2>
            <p className="mt-1 text-sm leading-7 text-charcoal/66">
              {entry.eventType} on {formatDate(entry.eventDate)} via{" "}
              {entry.fulfillmentMethod === "delivery" ? "delivery" : "pickup"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-charcoal/8 bg-ivory/80 px-3 py-1 text-xs text-charcoal/72">
              {entry.itemCount} item{entry.itemCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-charcoal/8 bg-ivory/80 px-3 py-1 text-xs text-charcoal/72">
              Total {entry.totalLabel}
            </span>
            <span className="rounded-full border border-charcoal/8 bg-ivory/80 px-3 py-1 text-xs text-charcoal/72">
              Balance {entry.balanceDueLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <LinkButton href={`/admin/orders/${entry.id}`} label="Open order" />
          {entry.customerId ? (
            <Link
              href={`/admin/customers/${entry.customerId}`}
              className="inline-flex h-12 items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
            >
              Open customer
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const filters = parseOrderListFilters(await searchParams);
  const data = await getOrderListData(filters);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        {data.summary.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.9rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              {item.label}
            </p>
            <p className="mt-3 font-serif text-4xl tracking-[-0.04em] text-charcoal">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-7 text-charcoal/62">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2.2rem] border border-charcoal/10 bg-paper p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              Order filters
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-charcoal">
              Keep production and payment follow-up visible at a glance.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-charcoal/64">
              This view stays intentionally practical: who the order belongs to, when it is
              happening, how it will be fulfilled, and whether money is still outstanding.
            </p>
          </div>

          <div className="rounded-full border border-charcoal/10 bg-white/85 px-4 py-3 text-sm text-charcoal/66">
            {data.totalCount} total orders in the system
          </div>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-3">
          <FilterCard label="Search">
            <Input
              name="search"
              defaultValue={filters.search}
              placeholder="Customer, event, or reference code"
            />
          </FilterCard>

          <FilterCard label="Status">
            <Select name="status" defaultValue={filters.status}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="quoted">Quoted</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-production">In production</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </FilterCard>

          <FilterCard label="Payment state">
            <Select name="paymentState" defaultValue={filters.paymentState}>
              <option value="all">All payment states</option>
              <option value="unpaid">Unpaid</option>
              <option value="deposit-paid">Deposit paid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </Select>
          </FilterCard>

          <FilterCard label="Fulfillment">
            <Select name="fulfillmentMethod" defaultValue={filters.fulfillmentMethod}>
              <option value="all">Pickup and delivery</option>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </Select>
          </FilterCard>

          <FilterCard label="Event date from">
            <Input name="eventDateFrom" type="date" defaultValue={filters.eventDateFrom} />
          </FilterCard>

          <FilterCard label="Event date to">
            <Input name="eventDateTo" type="date" defaultValue={filters.eventDateTo} />
          </FilterCard>

          <div className="flex gap-3 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-medium tracking-[0.02em] text-ivory shadow-soft transition hover:bg-charcoal/90"
            >
              Apply filters
            </button>
            <Link
              href="/admin/orders"
              className="inline-flex h-12 items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
            >
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {data.entries.length > 0 ? (
          data.entries.map((entry) => <OrderCard key={entry.id} entry={entry} />)
        ) : (
          <div className="rounded-[2rem] border border-charcoal/10 bg-white/85 p-8 text-center shadow-soft">
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-charcoal">
              No orders match these filters.
            </h2>
            <p className="mt-3 text-sm leading-7 text-charcoal/62">
              Try a broader payment state or event date range, or convert a live inquiry into a new
              order from the inquiry detail page.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
