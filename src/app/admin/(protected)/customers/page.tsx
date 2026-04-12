import Link from "next/link";

import { ActiveFilterPills, type ActiveFilterPill } from "@/components/admin/active-filter-pills";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CompactEmptyState } from "@/components/admin/compact-empty-state";
import { FilterSheet } from "@/components/admin/filter-sheet";
import { StatusChipRow } from "@/components/admin/status-chip-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getCustomerListData,
  parseCustomerListFilters,
  type CustomerListEntry,
  type CustomerListFilters,
} from "@/lib/admin/customers";
import { formatOptionalDateTime } from "@/lib/admin/order-workflow";
import { toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Customers",
};

type AdminCustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CustomerSegment = "all" | "email-preferred" | "leads" | "repeat";

const DEFAULT_CUSTOMER_FILTERS: CustomerListFilters = {
  preferredContact: "all",
  repeatState: "all",
  search: "",
};
const DEFAULT_SEGMENT: CustomerSegment = "all";
const customerTypeLabels: Record<NonNullable<CustomerListFilters["repeatState"]>, string> = {
  all: "All",
  new: "New",
  repeat: "Repeat",
};
const preferredContactLabels: Record<NonNullable<CustomerListFilters["preferredContact"]>, string> = {
  all: "All methods",
  email: "Email",
  phone: "Phone",
  text: "Text",
};
const segmentLabels: Record<CustomerSegment, string> = {
  all: "All",
  "email-preferred": "Email preferred",
  leads: "Leads",
  repeat: "Repeat",
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getCustomerSegment(
  rawSearchParams: Record<string, string | string[] | undefined>,
): CustomerSegment {
  const rawSegment = getSearchValue(rawSearchParams.segment);

  if (rawSegment === "repeat" || rawSegment === "leads" || rawSegment === "email-preferred") {
    return rawSegment;
  }

  return DEFAULT_SEGMENT;
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

function buildCustomersHref(
  filters: CustomerListFilters,
  segment: CustomerSegment = DEFAULT_SEGMENT,
  overrides: Partial<CustomerListFilters> = {},
) {
  const nextFilters: CustomerListFilters = {
    ...filters,
    ...overrides,
  };
  const searchParams = new URLSearchParams();

  if (segment !== DEFAULT_SEGMENT) {
    searchParams.set("segment", segment);
  }

  if (nextFilters.search) {
    searchParams.set("search", nextFilters.search);
  }

  if (nextFilters.preferredContact !== DEFAULT_CUSTOMER_FILTERS.preferredContact) {
    searchParams.set("preferredContact", nextFilters.preferredContact);
  }

  if (nextFilters.repeatState !== DEFAULT_CUSTOMER_FILTERS.repeatState) {
    searchParams.set("repeatState", nextFilters.repeatState);
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/customers?${queryString}` : "/admin/customers";
}

function isLeadCustomer(entry: CustomerListEntry) {
  return entry.orderCount === 0;
}

function filterCustomersBySegment(
  entries: CustomerListEntry[],
  segment: CustomerSegment,
) {
  switch (segment) {
    case "repeat":
      return entries.filter((entry) => entry.repeatValue);
    case "leads":
      return entries.filter(isLeadCustomer);
    case "email-preferred":
      return entries.filter((entry) => entry.preferredContact === "email");
    default:
      return entries;
  }
}

function getActiveFilterPills(
  filters: CustomerListFilters,
  segment: CustomerSegment,
): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];

  if (filters.search) {
    pills.push({
      clearHref: buildCustomersHref(filters, segment, { search: "" }),
      label: "Search",
      value: filters.search,
    });
  }

  if (filters.preferredContact !== DEFAULT_CUSTOMER_FILTERS.preferredContact) {
    pills.push({
      clearHref: buildCustomersHref(filters, segment, {
        preferredContact: DEFAULT_CUSTOMER_FILTERS.preferredContact,
      }),
      label: "Preferred contact",
      value: preferredContactLabels[filters.preferredContact] ?? toTitleCase(filters.preferredContact),
    });
  }

  if (filters.repeatState !== DEFAULT_CUSTOMER_FILTERS.repeatState) {
    pills.push({
      clearHref: buildCustomersHref(filters, segment, {
        repeatState: DEFAULT_CUSTOMER_FILTERS.repeatState,
      }),
      label: "Customer type",
      value: customerTypeLabels[filters.repeatState],
    });
  }

  return pills;
}

function CustomerCard({ entry }: Readonly<{ entry: CustomerListEntry }>) {
  return (
    <article className="rounded-[1.75rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft transition hover:border-charcoal/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
              {entry.orderCount} order{entry.orderCount === 1 ? "" : "s"}
            </Badge>
            <span className="rounded-full border border-charcoal/10 bg-ivory/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/75">
              {entry.repeatLabel}
            </span>
            <span className="rounded-full border border-charcoal/10 bg-white/86 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/65">
              {toTitleCase(entry.preferredContact)}
            </span>
          </div>

          <div>
            <h2 className="font-serif text-[1.9rem] tracking-[-0.03em] text-charcoal">
              {entry.fullName}
            </h2>
            <p className="mt-1 text-sm leading-7 text-charcoal/66">
              Preferred contact: {toTitleCase(entry.preferredContact)}
            </p>
          </div>

          <div className="space-y-1 text-sm leading-7 text-charcoal/62">
            <p>{entry.email ?? "No email yet"}</p>
            <p>{entry.phone ?? "No phone yet"}</p>
            <p>Lead source: {entry.leadSource ?? "Not captured yet"}</p>
          </div>
        </div>

        <div className="flex min-w-[16rem] flex-col gap-3">
          <div className="rounded-[1.35rem] border border-charcoal/8 bg-ivory/70 p-3.5 text-sm text-charcoal/66">
            <p>Last inquiry: {formatOptionalDateTime(entry.lastInquiryAt)}</p>
            <p className="mt-2">Last order: {formatOptionalDateTime(entry.lastOrderAt)}</p>
          </div>

          <LinkButton href={`/admin/customers/${entry.id}`} label="Open customer" />
        </div>
      </div>
    </article>
  );
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseCustomerListFilters(resolvedSearchParams);
  const segment = getCustomerSegment(resolvedSearchParams);
  const data = await getCustomerListData(filters);
  const visibleEntries = filterCustomersBySegment(data.entries, segment);
  const activeFilterPills = getActiveFilterPills(filters, segment);
  const segmentCounts = {
    all: data.entries.length,
    "email-preferred": data.entries.filter((entry) => entry.preferredContact === "email").length,
    leads: data.entries.filter(isLeadCustomer).length,
    repeat: data.entries.filter((entry) => entry.repeatValue).length,
  } satisfies Record<CustomerSegment, number>;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        className="!rounded-[1.65rem] !p-4 sm:!p-5"
        hideTitleOnMobile
        title="Customers"
        meta={
          <span>
            <span className="font-semibold text-charcoal">{visibleEntries.length}</span>{" "}
            {segmentLabels[segment].toLowerCase()}
          </span>
        }
        actions={
          <FilterSheet
            title="Customer filters"
            description="Advanced customer filters live here so search and the working list stay at the top."
          >
            <form method="get" className="grid gap-4">
              {filters.search ? <input type="hidden" name="search" value={filters.search} /> : null}
              {segment !== DEFAULT_SEGMENT ? <input type="hidden" name="segment" value={segment} /> : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <FilterCard label="Preferred contact">
                  <Select name="preferredContact" defaultValue={filters.preferredContact}>
                    <option value="all">All methods</option>
                    <option value="email">Email</option>
                    <option value="text">Text</option>
                    <option value="phone">Phone</option>
                  </Select>
                </FilterCard>

                <FilterCard label="Customer type">
                  <Select name="repeatState" defaultValue={filters.repeatState}>
                    <option value="all">All customers</option>
                    <option value="repeat">Repeat or returning</option>
                    <option value="new">New only</option>
                  </Select>
                </FilterCard>
              </div>

              <div className="flex flex-col gap-3 rounded-[1.35rem] border border-charcoal/8 bg-white/85 p-4 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-sm text-charcoal/62">
                  {data.totalCount} total customers in the system
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <LinkButton
                    href={buildCustomersHref(
                      { ...DEFAULT_CUSTOMER_FILTERS, search: filters.search },
                      segment,
                    )}
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
        <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {segment !== DEFAULT_SEGMENT ? <input type="hidden" name="segment" value={segment} /> : null}
          {filters.preferredContact !== DEFAULT_CUSTOMER_FILTERS.preferredContact ? (
            <input type="hidden" name="preferredContact" value={filters.preferredContact} />
          ) : null}
          {filters.repeatState !== DEFAULT_CUSTOMER_FILTERS.repeatState ? (
            <input type="hidden" name="repeatState" value={filters.repeatState} />
          ) : null}

          <div className="flex-1">
            <Label htmlFor="customer-search" className="sr-only">
              Search customers
            </Label>
            <Input
              id="customer-search"
              name="search"
              defaultValue={filters.search}
              placeholder="Search by name, email, phone, or lead source"
              className="h-12 rounded-[1.35rem] bg-white/92"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="h-12 px-5">
              Search
            </Button>
            {filters.search ? (
              <LinkButton
                href={buildCustomersHref(filters, segment, { search: "" })}
                label="Clear"
                variant="secondary"
              />
            ) : null}
          </div>
        </form>

        <StatusChipRow
          ariaLabel="Customer segments"
          items={[
            {
              count: segmentCounts.all,
              href: buildCustomersHref(filters, "all"),
              isActive: segment === "all",
              label: "All",
            },
            {
              count: segmentCounts.repeat,
              href: buildCustomersHref(filters, "repeat"),
              isActive: segment === "repeat",
              label: "Repeat",
            },
            {
              count: segmentCounts.leads,
              href: buildCustomersHref(filters, "leads"),
              isActive: segment === "leads",
              label: "Leads",
            },
            {
              count: segmentCounts["email-preferred"],
              href: buildCustomersHref(filters, "email-preferred"),
              isActive: segment === "email-preferred",
              label: "Email preferred",
            },
          ]}
        />

        {activeFilterPills.length > 0 ? (
          <ActiveFilterPills
            clearAllHref={buildCustomersHref(DEFAULT_CUSTOMER_FILTERS, segment)}
            items={activeFilterPills}
          />
        ) : null}
      </AdminPageHeader>

      <section className="space-y-3">
        {visibleEntries.length > 0 ? (
          visibleEntries.map((entry) => <CustomerCard key={entry.id} entry={entry} />)
        ) : (
          <CompactEmptyState
            title="No customers match this view"
            description="Try a broader search or clear the customer filters to bring more records back into the CRM list."
            action={<LinkButton href="/admin/customers" label="Show all customers" variant="secondary" />}
          />
        )}
      </section>
    </div>
  );
}
