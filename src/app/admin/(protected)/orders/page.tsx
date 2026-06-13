import Link from "next/link";

import {
  ActiveFilterPills,
  type ActiveFilterPill,
} from "@/components/admin/active-filter-pills";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CompactEmptyState } from "@/components/admin/compact-empty-state";
import { FilterSheet } from "@/components/admin/filter-sheet";
import { StatusChipRow } from "@/components/admin/status-chip-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getOrderListData,
  parseOrderListFilters,
  type OrderListEntry,
  type OrderListFilters,
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

type OrderQueue = "active" | "awaiting-payment" | "completed" | "upcoming";

const DEFAULT_ORDER_FILTERS: OrderListFilters = {
  eventDateFrom: "",
  eventDateTo: "",
  fulfillmentMethod: "all",
  paymentState: "all",
  search: "",
  status: "all",
};
const DEFAULT_QUEUE: OrderQueue = "active";
const fulfillmentLabels: Record<string, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
};
const paymentLabels: Record<string, string> = {
  "deposit-paid": "Deposit paid",
  paid: "Paid",
  refunded: "Refunded",
  unpaid: "Unpaid",
};
const queueLabels: Record<OrderQueue, string> = {
  active: "Active",
  "awaiting-payment": "Awaiting payment",
  completed: "Completed",
  upcoming: "Upcoming",
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function getOrderQueue(
  rawSearchParams: Record<string, string | string[] | undefined>,
): OrderQueue {
  const rawQueue = getSearchValue(rawSearchParams.queue);

  if (
    rawQueue === "awaiting-payment" ||
    rawQueue === "upcoming" ||
    rawQueue === "completed"
  ) {
    return rawQueue;
  }

  return DEFAULT_QUEUE;
}

function FilterCard({
  children,
  label,
}: Readonly<{
  children: React.ReactNode;
  label: string;
}>) {
  return (
    <div className="rounded-[1.35rem] border border-charcoal/8 bg-white/85 p-4">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function LinkButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex h-11 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-medium tracking-[0.02em] text-ivory shadow-soft transition hover:bg-charcoal/90"
          : "inline-flex h-11 items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
      }
    >
      {label}
    </Link>
  );
}

function buildOrdersHref(
  filters: OrderListFilters,
  queue: OrderQueue = DEFAULT_QUEUE,
  overrides: Partial<OrderListFilters> = {},
) {
  const nextFilters: OrderListFilters = {
    ...filters,
    ...overrides,
  };
  const searchParams = new URLSearchParams();

  if (queue !== DEFAULT_QUEUE) {
    searchParams.set("queue", queue);
  }

  if (nextFilters.search) {
    searchParams.set("search", nextFilters.search);
  }

  if (nextFilters.status !== DEFAULT_ORDER_FILTERS.status) {
    searchParams.set("status", nextFilters.status);
  }

  if (nextFilters.paymentState !== DEFAULT_ORDER_FILTERS.paymentState) {
    searchParams.set("paymentState", nextFilters.paymentState);
  }

  if (
    nextFilters.fulfillmentMethod !== DEFAULT_ORDER_FILTERS.fulfillmentMethod
  ) {
    searchParams.set("fulfillmentMethod", nextFilters.fulfillmentMethod);
  }

  if (nextFilters.eventDateFrom) {
    searchParams.set("eventDateFrom", nextFilters.eventDateFrom);
  }

  if (nextFilters.eventDateTo) {
    searchParams.set("eventDateTo", nextFilters.eventDateTo);
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/orders?${queryString}` : "/admin/orders";
}

function isActiveOrder(entry: OrderListEntry) {
  return entry.status !== "completed" && entry.status !== "cancelled";
}

function isAwaitingPaymentOrder(entry: OrderListEntry) {
  return (
    entry.status !== "cancelled" &&
    entry.paymentState !== "paid" &&
    entry.paymentState !== "refunded"
  );
}

function isUpcomingOrder(entry: OrderListEntry, today: string) {
  return entry.status !== "cancelled" && entry.eventDate >= today;
}

function isCompletedOrder(entry: OrderListEntry) {
  return entry.status === "completed";
}

function filterOrdersByQueue(
  entries: OrderListEntry[],
  queue: OrderQueue,
  today: string,
) {
  switch (queue) {
    case "awaiting-payment":
      return entries.filter(isAwaitingPaymentOrder);
    case "upcoming":
      return entries.filter((entry) => isUpcomingOrder(entry, today));
    case "completed":
      return entries.filter(isCompletedOrder);
    default:
      return entries.filter(isActiveOrder);
  }
}

function getActiveFilterPills(
  filters: OrderListFilters,
  queue: OrderQueue,
): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];

  if (filters.search) {
    pills.push({
      clearHref: buildOrdersHref(filters, queue, { search: "" }),
      label: "Search",
      value: filters.search,
    });
  }

  if (filters.status !== DEFAULT_ORDER_FILTERS.status) {
    pills.push({
      clearHref: buildOrdersHref(filters, queue, {
        status: DEFAULT_ORDER_FILTERS.status,
      }),
      label: "Status",
      value: toTitleCase(filters.status),
    });
  }

  if (filters.paymentState !== DEFAULT_ORDER_FILTERS.paymentState) {
    pills.push({
      clearHref: buildOrdersHref(filters, queue, {
        paymentState: DEFAULT_ORDER_FILTERS.paymentState,
      }),
      label: "Payment",
      value:
        paymentLabels[filters.paymentState] ??
        toTitleCase(filters.paymentState),
    });
  }

  if (filters.fulfillmentMethod !== DEFAULT_ORDER_FILTERS.fulfillmentMethod) {
    pills.push({
      clearHref: buildOrdersHref(filters, queue, {
        fulfillmentMethod: DEFAULT_ORDER_FILTERS.fulfillmentMethod,
      }),
      label: "Fulfillment",
      value:
        fulfillmentLabels[filters.fulfillmentMethod] ??
        toTitleCase(filters.fulfillmentMethod),
    });
  }

  if (filters.eventDateFrom) {
    pills.push({
      clearHref: buildOrdersHref(filters, queue, { eventDateFrom: "" }),
      label: "From",
      value: formatDate(filters.eventDateFrom),
    });
  }

  if (filters.eventDateTo) {
    pills.push({
      clearHref: buildOrdersHref(filters, queue, { eventDateTo: "" }),
      label: "To",
      value: formatDate(filters.eventDateTo),
    });
  }

  return pills;
}

function OrderCard({ entry }: Readonly<{ entry: OrderListEntry }>) {
  return (
    <article className="rounded-2xl border border-charcoal/10 bg-white/88 p-4 shadow-sm transition hover:border-charcoal/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Col: Core Identity & Event */}
        <div className="flex flex-col gap-1.5 lg:w-[40%]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${getOrderStatusClasses(entry.status)}`}
            >
              {toTitleCase(entry.status)}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${getPaymentStatusClasses(entry.paymentState)}`}
            >
              {entry.paymentStateLabel}
            </span>
            <span className="text-xs font-mono text-charcoal/50">
              {entry.referenceCode}
            </span>
          </div>
          <h2 className="font-serif text-xl font-medium tracking-tight text-charcoal mt-1">
            {entry.customerLabel}
          </h2>
          <p className="text-[13px] text-charcoal/70">
            {entry.eventType} on {formatDate(entry.eventDate)} via{" "}
            {entry.fulfillmentMethod === "delivery" ? "delivery" : "pickup"}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {entry.customerEmail && (
              <a
                href={`mailto:${entry.customerEmail}`}
                className="text-xs text-charcoal/60 hover:text-charcoal underline underline-offset-2"
              >
                Email
              </a>
            )}
            {entry.customerEmail && entry.customerPhone && (
              <span className="text-charcoal/30">•</span>
            )}
            {entry.customerPhone && (
              <a
                href={`tel:${entry.customerPhone.replace(/\D/g, "")}`}
                className="text-xs text-charcoal/60 hover:text-charcoal underline underline-offset-2"
              >
                Phone
              </a>
            )}
          </div>
        </div>

        {/* Middle Col: Financials & Fulfillment */}
        <div className="flex flex-col gap-2.5 lg:flex-1 lg:border-l lg:border-charcoal/8 lg:pl-5">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-charcoal/8 bg-ivory/80 px-2.5 py-0.5 text-xs font-medium text-charcoal/72">
              {entry.itemCount} item{entry.itemCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-charcoal/8 bg-ivory/80 px-2.5 py-0.5 text-xs font-medium text-charcoal/72">
              Total {entry.totalLabel}
            </span>
            {entry.balanceDue > 0 ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                Bal: {entry.balanceDueLabel}
              </span>
            ) : (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Paid
              </span>
            )}
          </div>
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-xs text-charcoal/66">
            <div>
              <span className="font-medium text-charcoal/45">Fulfillment:</span>{" "}
              {entry.fulfillmentMethod === "delivery" ? "Delivery" : "Pickup"}
            </div>
          </div>
        </div>

        {/* Right Col: Actions */}
        <div className="mt-1 lg:mt-0 lg:ml-4 lg:shrink-0 flex items-center justify-end gap-3 border-t border-charcoal/8 pt-4 lg:border-t-0 lg:pt-0 lg:flex-col lg:gap-2">
          {entry.customerId && (
            <LinkButton
              href={`/admin/customers/${entry.customerId}`}
              label="Customer"
              variant="secondary"
            />
          )}
          <LinkButton href={`/admin/orders/${entry.id}`} label="View details" />
        </div>
      </div>
    </article>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseOrderListFilters(resolvedSearchParams);
  const queue = getOrderQueue(resolvedSearchParams);
  const data = await getOrderListData(filters);
  const today = new Date().toISOString().slice(0, 10);
  const queueEntries = filterOrdersByQueue(data.entries, queue, today);
  const activeFilterPills = getActiveFilterPills(filters, queue);
  const queueCounts = {
    active: data.entries.filter(isActiveOrder).length,
    "awaiting-payment": data.entries.filter(isAwaitingPaymentOrder).length,
    completed: data.entries.filter(isCompletedOrder).length,
    upcoming: data.entries.filter((entry) => isUpcomingOrder(entry, today))
      .length,
  } satisfies Record<OrderQueue, number>;

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      <AdminPageHeader
        className="!rounded-[1.65rem] !p-4 sm:!p-5"
        hideTitleOnMobile
        title="Orders"
        meta={
          <span>
            <span className="font-semibold text-charcoal">
              {queueEntries.length}
            </span>{" "}
            {queueLabels[queue].toLowerCase()}
          </span>
        }
        actions={
          <FilterSheet
            title="Order filters"
            description="Search, payment, fulfillment, and date filters live here so the working list stays visible."
          >
            <form method="get" className="grid gap-4 lg:grid-cols-2">
              {queue !== DEFAULT_QUEUE ? (
                <input type="hidden" name="queue" value={queue} />
              ) : null}

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
                <Select
                  name="fulfillmentMethod"
                  defaultValue={filters.fulfillmentMethod}
                >
                  <option value="all">Pickup and delivery</option>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </Select>
              </FilterCard>

              <FilterCard label="Event date from">
                <Input
                  name="eventDateFrom"
                  type="date"
                  defaultValue={filters.eventDateFrom}
                />
              </FilterCard>

              <FilterCard label="Event date to">
                <Input
                  name="eventDateTo"
                  type="date"
                  defaultValue={filters.eventDateTo}
                />
              </FilterCard>

              <div className="flex flex-col gap-3 rounded-[1.35rem] border border-charcoal/8 bg-white/85 p-4 sm:flex-row sm:items-end sm:justify-between lg:col-span-2">
                <p className="text-sm text-charcoal/62">
                  {data.totalCount} total orders in the system
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <LinkButton
                    href={buildOrdersHref(DEFAULT_ORDER_FILTERS, queue)}
                    label="Clear"
                    variant="secondary"
                  />
                  <Button type="submit">Apply filters</Button>
                </div>
              </div>
            </form>
          </FilterSheet>
        }
      >
        <StatusChipRow
          ariaLabel="Order queue filters"
          items={[
            {
              count: queueCounts.active,
              href: buildOrdersHref(filters, "active"),
              isActive: queue === "active",
              label: "Active",
            },
            {
              count: queueCounts["awaiting-payment"],
              href: buildOrdersHref(filters, "awaiting-payment"),
              isActive: queue === "awaiting-payment",
              label: "Awaiting payment",
            },
            {
              count: queueCounts.upcoming,
              href: buildOrdersHref(filters, "upcoming"),
              isActive: queue === "upcoming",
              label: "Upcoming",
            },
            {
              count: queueCounts.completed,
              href: buildOrdersHref(filters, "completed"),
              isActive: queue === "completed",
              label: "Completed",
            },
          ]}
        />

        {activeFilterPills.length > 0 ? (
          <ActiveFilterPills
            clearAllHref={buildOrdersHref(DEFAULT_ORDER_FILTERS, queue)}
            items={activeFilterPills}
          />
        ) : null}
      </AdminPageHeader>

      <section className="space-y-3">
        {queueEntries.length > 0 ? (
          queueEntries.map((entry) => (
            <OrderCard key={entry.id} entry={entry} />
          ))
        ) : (
          <CompactEmptyState
            title="No orders match this view"
            description="Try widening the payment, date, or search filters to bring more orders back into the working queue."
            action={
              <LinkButton
                href={buildOrdersHref(DEFAULT_ORDER_FILTERS, queue)}
                label="Reset filters"
                variant="secondary"
              />
            }
          />
        )}
      </section>
    </div>
  );
}
