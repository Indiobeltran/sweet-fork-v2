import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getInquiryListData,
  parseInquiryListFilters,
  type InquiryListEntry,
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

function getSignalClasses(value: InquirySignalPriority | InquirySignalUrgency | null) {
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
    <div className="rounded-[1.6rem] border border-charcoal/8 bg-white/85 p-4">
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
          ? "inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-medium tracking-[0.02em] text-ivory shadow-soft transition hover:bg-charcoal/90"
          : "inline-flex h-12 items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
      }
    >
      {label}
    </Link>
  );
}

function InquiryListNotice({ notice }: { notice: string | undefined }) {
  if (!notice) {
    return null;
  }

  const copyByNotice: Record<string, { className: string; text: string }> = {
    "delete-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The inquiry could not be deleted. Please try again.",
    },
    deleted: {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Inquiry deleted.",
    },
  };

  const copy = copyByNotice[notice];

  if (!copy) {
    return null;
  }

  return (
    <div className={`rounded-[1.6rem] border px-4 py-3 text-sm font-medium ${copy.className}`}>
      {copy.text}
    </div>
  );
}

function InquiryCard({ entry }: { entry: InquiryListEntry }) {
  return (
    <article className="rounded-[2rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft transition hover:border-charcoal/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
              {entry.referenceCode}
            </Badge>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(entry.status)}`}
            >
              {toTitleCase(entry.status)}
            </span>
          </div>

          <div>
            <h2 className="font-serif text-3xl tracking-[-0.03em] text-charcoal">
              {entry.customerName}
            </h2>
            <p className="mt-1 text-sm leading-7 text-charcoal/66">
              {entry.eventType} on {formatDate(entry.eventDate)} via{" "}
              {entry.fulfillmentMethod === "delivery" ? "delivery" : "pickup"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {entry.items.map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-charcoal/8 bg-ivory/80 px-3 py-1 text-xs text-charcoal/72"
              >
                {item.productLabel}: {item.requestedQuantityLabel}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[19rem]">
          <div className="rounded-[1.5rem] border border-charcoal/8 bg-ivory/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              Budget
            </p>
            <p className="mt-2 text-sm font-medium text-charcoal">
              {entry.budgetRangeLabel ?? "Not shared"}
            </p>
            <p className="mt-2 text-sm text-charcoal/60">
              Estimate: {entry.estimatedLabel ?? "Still to be set"}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-charcoal/8 bg-ivory/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              Signals
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${getSignalClasses(entry.priorityValue)}`}
              >
                Priority: {entry.priorityLabel}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${getSignalClasses(entry.urgencyValue)}`}
              >
                Timing: {entry.urgencyLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-charcoal/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm leading-7 text-charcoal/62">
          Submitted {formatDate(entry.submittedAt)}. Contact: {entry.customerEmail} •{" "}
          {entry.customerPhone}
        </div>

        <LinkButton href={`/admin/inquiries/${entry.id}`} label="Open inquiry" />
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
  const noticeValue = resolvedSearchParams.notice;
  const notice = Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;

  return (
    <div className="space-y-6">
      <InquiryListNotice notice={notice} />

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
              Inquiry filters
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-charcoal">
              Narrow the desk to what needs attention most.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-charcoal/64">
              Archived inquiries stay out of the default desk, and these filters keep the live list
              easy to scan when you’re juggling dates, products, and follow-up timing.
            </p>
          </div>

          <div className="rounded-full border border-charcoal/10 bg-white/85 px-4 py-3 text-sm text-charcoal/66">
            {data.totalCount} total inquiries in the system
          </div>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-3">
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
            <Select name="fulfillmentMethod" defaultValue={filters.fulfillmentMethod}>
              <option value="all">Pickup and delivery</option>
              <option value="pickup">Pickup only</option>
              <option value="delivery">Delivery only</option>
            </Select>
          </FilterCard>

          <FilterCard label="Event date from">
            <Input name="eventDateFrom" type="date" defaultValue={filters.eventDateFrom} />
          </FilterCard>

          <FilterCard label="Event date to">
            <Input name="eventDateTo" type="date" defaultValue={filters.eventDateTo} />
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

          <div className="flex items-end gap-3 rounded-[1.6rem] border border-charcoal/8 bg-white/85 p-4">
            <Button type="submit" className="flex-1">
              Apply filters
            </Button>
            <div className="flex flex-1">
              <LinkButton href="/admin/inquiries" label="Clear" variant="secondary" />
            </div>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <span
              key={status}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                status as Enums<"inquiry_status">,
              )}`}
            >
              {toTitleCase(status)}: {count}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {data.entries.length > 0 ? (
          data.entries.map((entry) => <InquiryCard key={entry.id} entry={entry} />)
        ) : (
          <div className="rounded-[2rem] border border-dashed border-charcoal/15 bg-white/80 px-6 py-10 text-center shadow-soft">
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-charcoal">
              No inquiries match this combination.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-charcoal/64">
              Try widening the event date, budget, or product filters to bring more inquiries back
              into view.
            </p>
            <div className="mt-5 flex justify-center">
              <LinkButton href="/admin/inquiries" label="Reset filters" variant="secondary" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
