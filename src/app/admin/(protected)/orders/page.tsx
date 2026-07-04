import Link from "next/link";
import { CalendarDays, PackageCheck, Plus, Truck } from "lucide-react";

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
import { ADMIN_MAX_FETCH_LIMIT } from "@/lib/admin/pagination";
import {
  getOrderStatusClasses,
  getOrderStatusLabel,
} from "@/lib/admin/order-workflow";
import {
  buildCombinedPaymentPill,
  filterOrdersBySearch,
  filterOrdersByQueue,
  getOrderRelativeDateLabel,
  groupOrdersByDueDate,
  isActiveOrder,
  isAwaitingPaymentOrder,
  isCompletedOrder,
  isUpcomingOrder,
  type OrderListQueue,
} from "@/lib/admin/order-list-view";
import { formatDate, toTitleCase } from "@/lib/utils";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { OrderQuickActions } from "./order-quick-actions";

export const metadata = {
  title: "Admin Orders",
};

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_ORDER_FILTERS: OrderListFilters = {
  eventDateFrom: "",
  eventDateTo: "",
  fulfillmentMethod: "all",
  paymentState: "all",
  search: "",
  status: "all",
};
const DEFAULT_QUEUE: OrderListQueue = "active";
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
const queueLabels: Record<OrderListQueue, string> = {
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
): OrderListQueue {
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

function NewOrderLink() {
  return (
    <Link
      href="/admin/orders/new"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-charcoal px-4 text-sm font-semibold text-ivory shadow-soft transition hover:bg-charcoal/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
    >
      <Plus aria-hidden="true" className="h-4 w-4" />
      New order
    </Link>
  );
}

function buildOrdersHref(
  filters: OrderListFilters,
  queue: OrderListQueue = DEFAULT_QUEUE,
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

function getActiveFilterPills(
  filters: OrderListFilters,
  queue: OrderListQueue,
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

function getPhoneHref(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";

  if (digits.length < 10) {
    return null;
  }

  return `tel:${digits.length === 10 ? `+1${digits}` : `+${digits}`}`;
}

function getMessageHref(entry: OrderListEntry) {
  if (entry.customerEmail) {
    const subject = encodeURIComponent(`${entry.referenceCode} order follow-up`);
    return `mailto:${encodeURIComponent(entry.customerEmail)}?subject=${subject}`;
  }

  return getPhoneHref(entry.customerPhone);
}

function getPaymentPillClasses(tone: "attention" | "paid") {
  return tone === "attention"
    ? "border-rose/28 bg-rose/10 text-charcoal"
    : "border-emerald-200 bg-emerald-50 text-emerald-900";
}

function FulfillmentChip({
  method,
}: Readonly<{
  method: OrderListEntry["fulfillmentMethod"];
}>) {
  const Icon = method === "delivery" ? Truck : PackageCheck;
  const label = method === "delivery" ? "Delivery" : "Pickup";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/8 bg-ivory/80 px-2.5 py-1 text-xs font-medium text-charcoal/68">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-charcoal/48" />
      {label}
    </span>
  );
}

function OrderCard({ entry }: Readonly<{ entry: OrderListEntry }>) {
  const paymentPill = buildCombinedPaymentPill(entry);
  const secondaryHref =
    entry.balanceDue > 0 ? `/admin/orders/${entry.id}#payments` : getMessageHref(entry);

  return (
    <article className="rounded-[1.45rem] border border-charcoal/10 bg-white/88 p-4 shadow-sm transition hover:border-charcoal/20">
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words font-serif text-[1.35rem] leading-tight tracking-[-0.035em] text-charcoal">
              {entry.customerLabel} — {entry.eventType}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-gold" />
              <span>
                {formatDate(entry.eventDate)} · {getOrderRelativeDateLabel(entry.eventDate, new Date().toISOString().slice(0, 10))}
              </span>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getOrderStatusClasses(entry.status)}`}
          >
            {getOrderStatusLabel(entry.status)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-charcoal/8 bg-ivory/80 px-2.5 py-1 text-xs font-medium text-charcoal/68">
            {entry.itemCount} item{entry.itemCount === 1 ? "" : "s"}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPaymentPillClasses(paymentPill.tone)}`}
          >
            {paymentPill.label}
          </span>
          <FulfillmentChip method={entry.fulfillmentMethod} />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-charcoal/8 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <LinkButton href={`/admin/orders/${entry.id}`} label="View details" />
            {secondaryHref ? (
              <LinkButton
                href={secondaryHref}
                label={entry.balanceDue > 0 ? "Collect payment" : "Message"}
                variant="secondary"
              />
            ) : (
              <LinkButton href={`/admin/orders/${entry.id}`} label="Message" variant="secondary" />
            )}
          </div>
          <OrderQuickActions
            balanceDue={entry.balanceDue}
            orderId={entry.id}
            status={entry.status}
          />
        </div>
      </div>
    </article>
  );
}

function OrderSection({
  entries,
  title,
  tone = "neutral",
}: Readonly<{
  entries: OrderListEntry[];
  title: string;
  tone?: "attention" | "neutral";
}>) {
  return (
    <section
      className={
        tone === "attention"
          ? "rounded-[1.7rem] border border-rose/24 bg-rose/10 p-3 shadow-soft sm:p-4"
          : "rounded-[1.7rem] border border-charcoal/10 bg-white/88 p-3 shadow-soft sm:p-4"
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="font-serif text-[1.7rem] tracking-[-0.04em] text-charcoal">
          {title}
        </h2>
        <span className="rounded-full border border-charcoal/8 bg-white/70 px-3 py-1 text-xs font-semibold text-charcoal/56">
          {entries.length}
        </span>
      </div>
      <div className="space-y-3">
        {entries.map((entry) => (
          <OrderCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseOrderListFilters(resolvedSearchParams);
  const queue = getOrderQueue(resolvedSearchParams);
  // The orders page segments the fetched set into client-side queue tabs with
  // count badges and due-date groupings, so it needs the whole working set
  // rather than a single page. Fetch it bounded by the shared ceiling.
  const data = await getOrderListData(filters, 1, ADMIN_MAX_FETCH_LIMIT);
  const today = new Date().toISOString().slice(0, 10);
  const queueEntries = filterOrdersByQueue(data.entries, queue, today);
  const visibleEntries = filters.search
    ? filterOrdersBySearch(queueEntries, filters.search)
    : queueEntries;
  const groupedEntries = filters.search ? [] : groupOrdersByDueDate(visibleEntries, today);
  const activeFilterPills = getActiveFilterPills(filters, queue);
  const queueCounts = {
    active: data.entries.filter(isActiveOrder).length,
    "awaiting-payment": data.entries.filter(isAwaitingPaymentOrder).length,
    completed: data.entries.filter(isCompletedOrder).length,
    upcoming: data.entries.filter((entry) => isUpcomingOrder(entry, today))
      .length,
  } satisfies Record<OrderListQueue, number>;

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      <AdminPageHeader
        className="!rounded-[1.65rem] !p-4 sm:!p-5"
        hideTitleOnMobile
        title="Orders"
        meta={
          <span>
            <span className="font-semibold text-charcoal">
              {visibleEntries.length}
            </span>{" "}
            {queueLabels[queue].toLowerCase()}
          </span>
        }
        actions={
          <>
            <NewOrderLink />
            <FilterSheet
              title="Order filters"
              description="Payment, fulfillment, and date filters live here so the working list stays visible."
            >
              <form method="get" className="grid gap-4 lg:grid-cols-2">
                {queue !== DEFAULT_QUEUE ? (
                  <input type="hidden" name="queue" value={queue} />
                ) : null}

                {filters.search ? (
                  <input type="hidden" name="search" value={filters.search} />
                ) : null}

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
          </>
        }
      >
        <AdminSearchInput
          defaultValue={filters.search}
          label="Search orders"
          placeholder="Search name, occasion, order #"
        />

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
        {visibleEntries.length > 0 ? (
          filters.search ? (
            <OrderSection title="Search results" entries={visibleEntries} />
          ) : queue === "completed" ? (
            <OrderSection title="Completed orders" entries={visibleEntries} />
          ) : (
            groupedEntries.map((section) => (
              <OrderSection
                key={section.key}
                title={section.label}
                entries={section.entries}
                tone={section.key === "overdue" ? "attention" : "neutral"}
              />
            ))
          )
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
