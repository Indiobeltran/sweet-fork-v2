import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InquiryQuoteBuilder } from "@/components/admin/inquiry-quote-builder";
import { getQuoteBuilderData } from "@/lib/admin/quotes";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Build quote",
};

type QuotePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNoticeValue(raw: Record<string, string | string[] | undefined>) {
  const value = raw.notice;
  return Array.isArray(value) ? value[0] : value;
}

export default async function InquiryQuotePage({ params, searchParams }: QuotePageProps) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const data = await getQuoteBuilderData(id);

  if (!data) {
    notFound();
  }

  const notice = getNoticeValue(rawSearchParams);

  return (
    <div className="min-w-0 space-y-4">
      <Link
        href={`/admin/inquiries/${data.inquiry.id}`}
        className="inline-flex min-h-10 items-center text-sm font-medium text-charcoal/68 underline decoration-gold/50 underline-offset-4 transition hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal"
      >
        ← Back to inquiry
      </Link>

      <AdminPageHeader
        eyebrow="Private pricing workspace"
        title="Build quote"
        description="Calibrate the work, review the recommendation, and create a customer-safe finalized quote without sending anything yet."
        meta={data.currentQuote ? `Version ${data.currentQuote.version} · ${data.currentQuote.status}` : "New quote"}
      >
        <div className="grid gap-3 rounded-[1.4rem] border border-charcoal/8 bg-white/70 p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <Summary label="Customer" value={data.inquiry.contact.name} />
          <Summary label="Event" value={`${data.inquiry.event.type} · ${formatDate(data.inquiry.event.date)}`} />
          <Summary label="Fulfillment" value={data.inquiry.event.fulfillmentMethod === "delivery" ? "Delivery" : "Pickup"} />
          <Summary label="Requested items" value={`${data.inquiry.items.length} ${data.inquiry.items.length === 1 ? "item" : "items"}`} />
        </div>
      </AdminPageHeader>

      <AdminNoticeBanner
        notice={notice}
        notices={{
          "pricing-profile-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The pricing profile could not be saved. Review the assumptions and try again.",
          },
          "pricing-profile-saved": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Pricing profile saved as a new version.",
          },
          "quote-draft-saved": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Quote draft saved. It can now be finalized while no edits are pending.",
          },
          "quote-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The quote draft could not be saved. Review the fields and try again.",
          },
          "quote-finalize-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The saved quote could not be finalized. Reload and try again.",
          },
          "quote-finalized": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Quote finalized and locked. The customer-safe message is ready to copy.",
          },
          "quote-revision-created": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "A new editable quote revision is ready.",
          },
          "quote-revision-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "A quote revision could not be created.",
          },
          "quote-revision-required": {
            className: "border-gold/25 bg-gold/8 text-charcoal",
            text: "The finalized quote is locked. Create a revision before making changes.",
          },
        }}
      />

      {data.calibrationNotice ? (
        <div role="alert" className="rounded-[1.5rem] border border-gold/30 bg-gold/8 px-4 py-3 text-sm leading-6 text-charcoal/76">
          {data.calibrationNotice}
        </div>
      ) : null}

      <InquiryQuoteBuilder data={data} />
    </div>
  );
}

function Summary({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">{label}</p>
      <p className="mt-1 break-words font-medium text-charcoal">{value}</p>
    </div>
  );
}
