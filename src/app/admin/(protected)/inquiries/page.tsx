import Link from "next/link";

import {
  ActiveFilterPills,
  type ActiveFilterPill,
} from "@/components/admin/active-filter-pills";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CompactEmptyState } from "@/components/admin/compact-empty-state";
import { FilterSheet } from "@/components/admin/filter-sheet";
import { StatusChipRow } from "@/components/admin/status-chip-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getInquiryListData,
  parseInquiryListFilters,
  type InquiryListEntry,
  type InquiryListFilters,
  type InquirySignalPriority,
  type InquirySignalUrgency,
} from "@/lib/admin/inquiries";
import { budgetRangeOptions } from "@/lib/inquiries/config";
import { formatDate, toTitleCase } from "@/lib/utils";
import type { Enums } from "@/types/supabase.generated";

export const metadata = {
  title: "Admin Inquiries",
};

type AdminInquiryListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_FILTERS: InquiryListFilters = {
  budgetRange: "all",
  eventDateFrom: "",
  eventDateTo: "",
  fulfillmentMethod: "all",
  priority: "all",
  productType: "all",
  search: "",
  status: "active",
  urgency: "all",
};

const productTypeLabels: Record<string, string> = {
  "custom-cake": "Custom cake",
  cupcakes: "Cupcakes",
  "diy-kit": "DIY kit",
  macarons: "Macarons",
  "sugar-cookies": "Sugar cookies",
  "wedding-cake": "Wedding cake",
};

const fulfillmentLabels: Record<string, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
};

const priorityLabels: Record<string, string> = {
  high: "High",
  standard: "Standard",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  all: "All",
  approved: "Approved",
  archived: "Archived",
  declined: "Declined",
  new: "New",
  quoted: "Quoted",
  reviewing: "Reviewing",
};

const urgencyLabels: Record<string, string> = {
  rush: "Rush",
  soon: "Soon",
  standard: "Standard",
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function getStatusClasses(status: Enums<"inquiry_status">) {
  switch (status) {
    case "new":
      return "border-gold/30 bg-gold/12 text-charcoal";
    case "reviewing":
      return "border-charcoal/15 bg-charcoal/6 text-charcoal";
    case "quoted":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "declined":
      return "border-stone/18 bg-stone/10 text-charcoal";
    case "archived":
      return "border-charcoal/10 bg-charcoal/5 text-charcoal/70";
    default:
      return "border-charcoal/10 bg-white text-charcoal";
  }
}

function getSignalClasses(
  value: InquirySignalPriority | InquirySignalUrgency | null,
) {
  switch (value) {
    case "high":
    case "rush":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "soon":
      return "border-gold/25 bg-gold/12 text-charcoal";
    case "standard":
      return "border-charcoal/10 bg-white text-charcoal/75";
    default:
      return "border-charcoal/8 bg-charcoal/5 text-charcoal/55";
  }
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

function buildInquiriesHref(
  filters: InquiryListFilters,
  overrides: Partial<InquiryListFilters> = {},
) {
  const nextFilters: InquiryListFilters = {
    ...filters,
    ...overrides,
  };
  const searchParams = new URLSearchParams();

  if (nextFilters.search) {
    searchParams.set("search", nextFilters.search);
  }

  if (nextFilters.status !== DEFAULT_FILTERS.status) {
    searchParams.set("status", nextFilters.status);
  }

  if (nextFilters.productType !== DEFAULT_FILTERS.productType) {
    searchParams.set("productType", nextFilters.productType);
  }

  if (nextFilters.fulfillmentMethod !== DEFAULT_FILTERS.fulfillmentMethod) {
    searchParams.set("fulfillmentMethod", nextFilters.fulfillmentMethod);
  }

  if (nextFilters.eventDateFrom) {
    searchParams.set("eventDateFrom", nextFilters.eventDateFrom);
  }

  if (nextFilters.eventDateTo) {
    searchParams.set("eventDateTo", nextFilters.eventDateTo);
  }

  if (nextFilters.budgetRange !== DEFAULT_FILTERS.budgetRange) {
    searchParams.set("budgetRange", nextFilters.budgetRange);
  }

  if (nextFilters.priority !== DEFAULT_FILTERS.priority) {
    searchParams.set("priority", nextFilters.priority);
  }

  if (nextFilters.urgency !== DEFAULT_FILTERS.urgency) {
    searchParams.set("urgency", nextFilters.urgency);
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/inquiries?${queryString}` : "/admin/inquiries";
}

function getActiveFilterPills(filters: InquiryListFilters): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];

  if (filters.search) {
    pills.push({
      clearHref: buildInquiriesHref(filters, { search: "" }),
      label: "Search",
      value: filters.search,
    });
  }

  if (filters.status !== DEFAULT_FILTERS.status) {
    pills.push({
      clearHref: buildInquiriesHref(filters, {
        status: DEFAULT_FILTERS.status,
      }),
      label: "Status",
      value: statusLabels[filters.status],
    });
  }

  if (filters.productType !== DEFAULT_FILTERS.productType) {
    pills.push({
      clearHref: buildInquiriesHref(filters, {
        productType: DEFAULT_FILTERS.productType,
      }),
      label: "Product",
      value:
        productTypeLabels[filters.productType] ??
        toTitleCase(filters.productType),
    });
  }

  if (filters.fulfillmentMethod !== DEFAULT_FILTERS.fulfillmentMethod) {
    pills.push({
      clearHref: buildInquiriesHref(filters, {
        fulfillmentMethod: DEFAULT_FILTERS.fulfillmentMethod,
      }),
      label: "Fulfillment",
      value:
        fulfillmentLabels[filters.fulfillmentMethod] ??
        toTitleCase(filters.fulfillmentMethod),
    });
  }

  if (filters.eventDateFrom) {
    pills.push({
      clearHref: buildInquiriesHref(filters, { eventDateFrom: "" }),
      label: "From",
      value: formatDate(filters.eventDateFrom),
    });
  }

  if (filters.eventDateTo) {
    pills.push({
      clearHref: buildInquiriesHref(filters, { eventDateTo: "" }),
      label: "To",
      value: formatDate(filters.eventDateTo),
    });
  }

  if (filters.budgetRange !== DEFAULT_FILTERS.budgetRange) {
    pills.push({
      clearHref: buildInquiriesHref(filters, {
        budgetRange: DEFAULT_FILTERS.budgetRange,
      }),
      label: "Budget",
      value:
        budgetRangeOptions.find(
          (option) => option.value === filters.budgetRange,
        )?.label ?? filters.budgetRange,
    });
  }

  if (filters.priority !== DEFAULT_FILTERS.priority) {
    pills.push({
      clearHref: buildInquiriesHref(filters, {
        priority: DEFAULT_FILTERS.priority,
      }),
      label: "Priority",
      value: priorityLabels[filters.priority] ?? toTitleCase(filters.priority),
    });
  }

  if (filters.urgency !== DEFAULT_FILTERS.urgency) {
    pills.push({
      clearHref: buildInquiriesHref(filters, {
        urgency: DEFAULT_FILTERS.urgency,
      }),
      label: "Timing",
      value: urgencyLabels[filters.urgency] ?? toTitleCase(filters.urgency),
    });
  }

  return pills;
}

function InquiryCard({ entry }: Readonly<{ entry: InquiryListEntry }>) {
  return (
    <article className="rounded-2xl border border-charcoal/10 bg-white/88 p-4 shadow-sm transition hover:border-charcoal/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Col: Core Identity & Event */}
        <div className="flex flex-col gap-1.5 lg:w-[35%]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusClasses(entry.status)}`}
            >
              {toTitleCase(entry.status)}
            </span>
            <span className="text-xs font-mono text-charcoal/50">
              {entry.referenceCode}
            </span>
          </div>
          <h2 className="font-serif text-xl font-medium tracking-tight text-charcoal mt-1">
            {entry.customerName}
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

        {/* Middle Col: Products & Summary */}
        <div className="flex flex-col gap-2.5 lg:flex-1 lg:border-l lg:border-charcoal/8 lg:pl-5">
          <div className="flex flex-wrap gap-1.5">
            {entry.items.map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-charcoal/8 bg-ivory/80 px-2.5 py-0.5 text-xs font-medium text-charcoal/72"
              >
                {item.productLabel}: {item.requestedQuantityLabel}
              </span>
            ))}
          </div>

          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-xs text-charcoal/66">
            <div>
              <span className="font-medium text-charcoal/45">Budget:</span>{" "}
              {entry.budgetRangeLabel ?? "Not shared"}
            </div>
            <div>
              <span className="font-medium text-charcoal/45">Est:</span>{" "}
              {entry.estimatedLabel ?? "Still to be set"}
            </div>
            <div>
              <span className="font-medium text-charcoal/45">Submitted:</span>{" "}
              {formatDate(entry.submittedAt)}
            </div>
            {entry.estimatedLabel ? (
              <details className="sm:col-span-2">
                <summary className="cursor-pointer select-none text-[11px] leading-5 text-charcoal/45 hover:text-charcoal/65">
                  Why this estimate?
                </summary>
                <div className="mt-1.5 space-y-1 rounded-[0.9rem] border border-charcoal/8 bg-ivory/60 px-3 py-2 text-[11px] leading-[1.55] text-charcoal/62">
                  <p>Internal starting range — not a customer quote.</p>
                  <p>
                    Final price depends on confirmed design details, servings, flavors,
                    and{" "}
                    {entry.fulfillmentMethod === "delivery"
                      ? "delivery specifics."
                      : "pickup logistics."}
                  </p>
                  {entry.budgetRangeLabel ? (
                    <p>Customer budget on file: {entry.budgetRangeLabel}.</p>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>

          {/* Signals */}
          <div className="flex flex-wrap gap-2 mt-0.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${getSignalClasses(entry.priorityValue)}`}
            >
              Pri: {entry.priorityLabel}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${getSignalClasses(entry.urgencyValue)}`}
            >
              Time: {entry.urgencyLabel}
            </span>
          </div>
        </div>

        {/* Right Col: Actions */}
        <div className="mt-1 lg:mt-0 lg:ml-4 lg:shrink-0 flex items-center justify-end border-t border-charcoal/8 pt-4 lg:border-t-0 lg:pt-0">
          <LinkButton
            href={`/admin/inquiries/${entry.id}`}
            label="View details"
          />
        </div>
      </div>
    </article>
  );
}

export default async function AdminInquiriesPage({
  searchParams,
}: AdminInquiryListPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseInquiryListFilters(resolvedSearchParams);
  const data = await getInquiryListData(filters);
  const notice = getSearchValue(resolvedSearchParams.notice);
  const activeFilterPills = getActiveFilterPills(filters);

  return (
    <div className="space-y-4">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "delete-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The inquiry could not be deleted. Please try again.",
          },
          deleted: {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Inquiry deleted.",
          },
        }}
      />

      <AdminPageHeader
        className="overflow-hidden !rounded-[1.65rem] !p-4 sm:!p-5"
        hideTitleOnMobile
        title="Inquiries"
        meta={
          <span>
            <span className="font-semibold text-charcoal">
              {data.summary[0]?.value ?? data.entries.length}
            </span>{" "}
            visible
          </span>
        }
        actions={
          <FilterSheet
            title="Inquiry filters"
            description="Narrow the queue without pushing the working list down the page."
          >
            <form method="get" className="grid gap-4 lg:grid-cols-2">
              <FilterCard label="Search">
                <Input
                  name="search"
                  defaultValue={filters.search}
                  placeholder="Customer, email, or reference code"
                />
              </FilterCard>

              <FilterCard label="Status">
                <Select name="status" defaultValue={filters.status}>
                  <option value="active">Active desk</option>
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="quoted">Quoted</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                  <option value="archived">Archived</option>
                </Select>
              </FilterCard>

              <FilterCard label="Product type">
                <Select name="productType" defaultValue={filters.productType}>
                  <option value="all">All products</option>
                  <option value="custom-cake">Custom cake</option>
                  <option value="wedding-cake">Wedding cake</option>
                  <option value="cupcakes">Cupcakes</option>
                  <option value="sugar-cookies">Sugar cookies</option>
                  <option value="macarons">Macarons</option>
                  <option value="diy-kit">DIY kit</option>
                </Select>
              </FilterCard>

              <FilterCard label="Fulfillment">
                <Select
                  name="fulfillmentMethod"
                  defaultValue={filters.fulfillmentMethod}
                >
                  <option value="all">Pickup and delivery</option>
                  <option value="pickup">Pickup only</option>
                  <option value="delivery">Delivery only</option>
                </Select>
              </FilterCard>

              <FilterCard label="Budget range">
                <Select name="budgetRange" defaultValue={filters.budgetRange}>
                  <option value="all">Any budget range</option>
                  {budgetRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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

              <FilterCard label="Priority signal">
                <Select name="priority" defaultValue={filters.priority}>
                  <option value="all">Any priority</option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                </Select>
              </FilterCard>

              <FilterCard label="Timing signal">
                <Select name="urgency" defaultValue={filters.urgency}>
                  <option value="all">Any timing</option>
                  <option value="standard">Standard</option>
                  <option value="soon">Soon</option>
                  <option value="rush">Rush</option>
                </Select>
              </FilterCard>

              <div className="flex flex-col gap-3 rounded-[1.35rem] border border-charcoal/8 bg-white/85 p-4 sm:flex-row sm:items-end sm:justify-between lg:col-span-2">
                <p className="text-sm text-charcoal/62">
                  {data.totalCount} total inquiries in the system
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <LinkButton
                    href="/admin/inquiries"
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
          ariaLabel="Inquiry status filters"
          items={[
            {
              href: buildInquiriesHref(filters, { status: "active" }),
              isActive: filters.status === "active",
              label: "Active",
            },
            {
              href: buildInquiriesHref(filters, { status: "reviewing" }),
              isActive: filters.status === "reviewing",
              label: "Reviewing",
            },
            {
              href: buildInquiriesHref(filters, { status: "quoted" }),
              isActive: filters.status === "quoted",
              label: "Quoted",
            },
            {
              href: buildInquiriesHref(filters, { status: "approved" }),
              isActive: filters.status === "approved",
              label: "Approved",
            },
            {
              href: buildInquiriesHref(filters, { status: "archived" }),
              isActive: filters.status === "archived",
              label: "Archived",
            },
          ]}
        />

        {activeFilterPills.length > 0 ? (
          <ActiveFilterPills
            clearAllHref="/admin/inquiries"
            items={activeFilterPills}
          />
        ) : null}
      </AdminPageHeader>

      <section className="space-y-3">
        {data.entries.length > 0 ? (
          data.entries.map((entry) => (
            <InquiryCard key={entry.id} entry={entry} />
          ))
        ) : (
          <CompactEmptyState
            title="No inquiries match this view"
            description="Try widening the date, product, or budget filters to bring more inquiries back into the queue."
            action={
              <LinkButton
                href="/admin/inquiries"
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
