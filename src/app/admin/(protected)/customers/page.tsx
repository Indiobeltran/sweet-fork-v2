import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getCustomerListData,
  parseCustomerListFilters,
  type CustomerListEntry,
} from "@/lib/admin/customers";
import {
  formatOptionalDateTime,
} from "@/lib/admin/order-workflow";
import { toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Customers",
};

type AdminCustomersPageProps = {
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

function CustomerCard({ entry }: { entry: CustomerListEntry }) {
  return (
    <article className="rounded-[2rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft transition hover:border-charcoal/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
              {entry.orderCount} order{entry.orderCount === 1 ? "" : "s"}
            </Badge>
            <span className="rounded-full border border-charcoal/10 bg-ivory/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/75">
              {entry.repeatLabel}
            </span>
          </div>

          <div>
            <h2 className="font-serif text-3xl tracking-[-0.03em] text-charcoal">
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
          <div className="rounded-[1.5rem] border border-charcoal/8 bg-ivory/70 p-4 text-sm text-charcoal/66">
            <p>Last inquiry: {formatOptionalDateTime(entry.lastInquiryAt)}</p>
            <p className="mt-2">Last order: {formatOptionalDateTime(entry.lastOrderAt)}</p>
          </div>

          <Link
            href={`/admin/customers/${entry.id}`}
            className="inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-medium tracking-[0.02em] text-ivory shadow-soft transition hover:bg-charcoal/90"
          >
            Open customer
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const filters = parseCustomerListFilters(await searchParams);
  const data = await getCustomerListData(filters);

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
              Customer filters
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-charcoal">
              Keep repeat business and contact details close at hand.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-charcoal/64">
              This list keeps the customer history lightweight: contact basics, repeat-customer
              visibility, and an easy jump into linked order history.
            </p>
          </div>

          <div className="rounded-full border border-charcoal/10 bg-white/85 px-4 py-3 text-sm text-charcoal/66">
            {data.totalCount} total customers in the system
          </div>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-3">
          <FilterCard label="Search">
            <Input
              name="search"
              defaultValue={filters.search}
              placeholder="Name, email, phone, or source"
            />
          </FilterCard>

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

          <div className="flex gap-3 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-medium tracking-[0.02em] text-ivory shadow-soft transition hover:bg-charcoal/90"
            >
              Apply filters
            </button>
            <Link
              href="/admin/customers"
              className="inline-flex h-12 items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
            >
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {data.entries.length > 0 ? (
          data.entries.map((entry) => <CustomerCard key={entry.id} entry={entry} />)
        ) : (
          <div className="rounded-[2rem] border border-charcoal/10 bg-white/85 p-8 text-center shadow-soft">
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-charcoal">
              No customers match these filters.
            </h2>
            <p className="mt-3 text-sm leading-7 text-charcoal/62">
              Try a broader search or convert an inquiry into an order to create a customer record.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
