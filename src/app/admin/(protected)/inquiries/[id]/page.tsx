import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addInquiryNote,
  deleteInquiry,
  updateInquiryStatus,
} from "@/app/admin/(protected)/inquiries/actions";
import { createOrderFromInquiry } from "@/app/admin/(protected)/orders/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getInquiryDetail,
  type InquiryAssetDisplay,
  type InquirySignalClarity,
  type InquirySignalPriority,
  type InquirySignalUrgency,
} from "@/lib/admin/inquiries";
import { getInquiryConversionData } from "@/lib/admin/orders";
import {
  getOrderStatusClasses,
  getPaymentStatusClasses,
} from "@/lib/admin/order-workflow";
import { BUSINESS_TIME_ZONE } from "@/lib/business-time";
import { cn, formatDate, toTitleCase } from "@/lib/utils";
import type { Enums } from "@/types/supabase.generated";

export const metadata = {
  title: "Inquiry Detail",
};

type AdminInquiryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const userTextClass = "min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]";
const compactTextClass = "min-w-0 break-words [overflow-wrap:anywhere]";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date(value));
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
  value: InquirySignalClarity | InquirySignalPriority | InquirySignalUrgency,
) {
  switch (value) {
    case "high":
    case "rush":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "medium":
    case "soon":
      return "border-gold/25 bg-gold/12 text-charcoal";
    case "standard":
    case "low":
      return "border-charcoal/10 bg-white text-charcoal/72";
    default:
      return "border-charcoal/8 bg-charcoal/5 text-charcoal/55";
  }
}

function SectionCard({
  children,
  title,
}: Readonly<{
  children: React.ReactNode;
  title: string;
}>) {
  return (
    <section className="min-w-0 max-w-full rounded-[1.75rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft sm:p-5">
      <h2 className="min-w-0 break-words font-serif text-[2rem] tracking-[-0.04em] text-charcoal sm:text-[2.1rem]">
        {title}
      </h2>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: React.ReactNode;
}>) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-charcoal/8 py-3 last:border-none last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
      <p className="shrink-0 text-sm text-charcoal/55">{label}</p>
      <div className={cn("max-w-full text-left text-sm font-medium text-charcoal sm:max-w-[70%] sm:text-right", userTextClass)}>
        {value}
      </div>
    </div>
  );
}

function NoticeBanner({ notice }: { notice: string | undefined }) {
  if (!notice) {
    return null;
  }

  const copyByNotice: Record<string, { className: string; text: string }> = {
    "convert-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The inquiry could not be converted into an order. Please try again.",
    },
    "note-added": {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Internal note saved.",
    },
    "note-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The note could not be saved. Please try again.",
    },
    "delete-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The inquiry could not be deleted. Please try again.",
    },
    "status-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The status change did not save. Please try again.",
    },
    "status-updated": {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Inquiry status updated.",
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

function AssetCard({ asset }: { asset: InquiryAssetDisplay }) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-[1.6rem] border border-charcoal/10 bg-ivory/70">
      {asset.signedUrl ? (
        <a href={asset.signedUrl} target="_blank" rel="noreferrer" className="block">
          <Image
            src={asset.signedUrl}
            alt={asset.label}
            width={1200}
            height={900}
            unoptimized
            className="h-52 w-full object-cover"
          />
        </a>
      ) : (
        <div className="flex h-52 items-center justify-center bg-charcoal/5 px-6 text-center text-sm leading-7 text-charcoal/58">
          Preview unavailable
        </div>
      )}

      <div className="space-y-2 p-4">
        <p className={cn("text-sm font-medium text-charcoal", compactTextClass)}>{asset.label}</p>
        {asset.originalFilename ? (
          <p className={cn("text-xs uppercase tracking-[0.16em] text-charcoal/45", compactTextClass)}>
            {asset.originalFilename}
          </p>
        ) : null}
        {asset.textContent ? (
          <p className={cn("text-sm leading-7 text-charcoal/70", userTextClass)}>{asset.textContent}</p>
        ) : null}
        {asset.url ? (
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className={cn("text-sm font-medium text-charcoal underline decoration-gold/60 underline-offset-4", compactTextClass)}
          >
            Open reference
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default async function AdminInquiryDetailPage({
  params,
  searchParams,
}: AdminInquiryDetailPageProps) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const [detail, conversion] = await Promise.all([
    getInquiryDetail(id),
    getInquiryConversionData(id),
  ]);

  if (!detail) {
    notFound();
  }

  const noticeValue = rawSearchParams.notice;
  const notice = Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
  const redirectTo = `/admin/inquiries/${detail.id}`;

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 transition hover:text-charcoal"
          >
            ← Back to inquiries
          </Link>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
              {detail.referenceCode}
            </Badge>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(detail.status)}`}
            >
              {toTitleCase(detail.status)}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className={cn("font-serif text-[2.3rem] tracking-[-0.04em] text-charcoal sm:text-[2.8rem]", compactTextClass)}>
              {detail.contact.customerName}
            </h1>
            <p className={cn("mt-2 text-sm leading-7 text-charcoal/66", compactTextClass)}>
              {detail.event.eventType} on {formatDate(detail.event.eventDate)} via{" "}
              {detail.event.fulfillmentMethod === "delivery" ? "delivery" : "pickup"}
            </p>
            <p className="mt-1 text-sm font-medium text-charcoal/70">
              {detail.items.length} {detail.items.length === 1 ? "item" : "items"} requested
            </p>
          </div>
        </div>

        <div className="min-w-0 max-w-full rounded-[1.55rem] border border-charcoal/10 bg-white/88 px-4 py-3 shadow-soft sm:shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
            Submitted
          </p>
          <p className={cn("mt-2 text-sm font-medium text-charcoal", compactTextClass)}>
            {formatDateTime(detail.submittedAt)}
          </p>
          <p className={cn("mt-2 text-sm text-charcoal/60", compactTextClass)}>
            Estimate: {detail.estimatedLabel ?? "Still to be set"}
          </p>
        </div>
      </div>

      <NoticeBanner notice={notice} />

      <SectionCard title="Triage actions">
        <div className="mb-5 flex min-w-0 flex-wrap items-center gap-3">
          {detail.contact.customerPhone ? (
            <a
              href={`tel:${detail.contact.customerPhone.replace(/\D/g, "")}`}
              className="inline-flex min-h-11 min-w-0 max-w-full items-center justify-center rounded-full border border-charcoal/15 bg-white px-5 py-2 text-center text-sm font-medium text-charcoal transition hover:bg-charcoal/5"
            >
              Call
            </a>
          ) : null}
          {detail.contact.customerEmail ? (
            <a
              href={`mailto:${detail.contact.customerEmail}`}
              className="inline-flex min-h-11 min-w-0 max-w-full items-center justify-center rounded-full border border-charcoal/15 bg-white px-5 py-2 text-center text-sm font-medium text-charcoal transition hover:bg-charcoal/5"
            >
              Email
            </a>
          ) : null}
          <a
            href="#convert-to-order"
            className="inline-flex min-h-11 min-w-0 max-w-full items-center justify-center rounded-full bg-charcoal px-5 py-2 text-center text-sm font-medium text-ivory transition hover:bg-charcoal/90"
          >
            Convert to order ↓
          </a>
        </div>

        <form
          action={updateInquiryStatus}
          className="flex min-w-0 flex-col gap-3 rounded-[1.4rem] border border-charcoal/8 bg-ivory/70 p-4 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="inquiryId" value={detail.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="min-w-0 flex-1">
            <Label htmlFor="status">Inquiry status</Label>
            <Select id="status" name="status" defaultValue={detail.status}>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="quoted">Quoted</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="archived">Archived</option>
            </Select>
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="w-full border-charcoal/15 bg-white text-charcoal hover:bg-charcoal/5 sm:w-auto"
          >
            Save status
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Internal notes">
        <form action={addInquiryNote} className="space-y-4">
          <input type="hidden" name="inquiryId" value={detail.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div>
            <Label htmlFor="noteBody" className="sr-only">
              Add a note
            </Label>
            <Textarea
              id="noteBody"
              name="noteBody"
              placeholder="Capture follow-up details, quote context, availability checks, or anything the next review pass should know."
              required
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex min-w-0 items-center gap-3 rounded-[1.4rem] border border-charcoal/10 bg-ivory/70 px-4 py-3 text-sm text-charcoal/72">
              <input
                type="checkbox"
                name="isPinned"
                className="h-4 w-4 rounded border border-charcoal/20"
              />
              Pin this note near the top
            </label>
            <Button type="submit" className="w-full sm:w-auto">
              Save note
            </Button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {detail.notes.length > 0 ? (
            detail.notes.map((note) => (
              <article
                key={note.id}
                className="min-w-0 max-w-full rounded-[1.5rem] border border-charcoal/10 bg-white/82 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {note.isPinned ? (
                    <Badge className="border-gold/25 bg-gold/10 text-charcoal/80">
                      Pinned
                    </Badge>
                  ) : null}
                  <span className="text-sm font-medium text-charcoal">{note.authorLabel}</span>
                  <span className="text-sm text-charcoal/52">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className={cn("mt-3 text-sm leading-8 text-charcoal/72", userTextClass)}>{note.noteBody}</p>
              </article>
            ))
          ) : (
            <p className="text-sm leading-7 text-charcoal/62">
              No internal notes yet. Add one to capture follow-up context for the next pass.
            </p>
          )}
        </div>
      </SectionCard>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
        <div className="min-w-0 space-y-6">
          <SectionCard title="Event details">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Event snapshot
                </p>
                <div className="mt-4">
                  <DetailRow label="Occasion" value={detail.event.eventType} />
                  <DetailRow label="Date" value={formatDate(detail.event.eventDate)} />
                  <DetailRow label="Time" value={detail.event.eventTime ?? "Not shared"} />
                  <DetailRow
                    label="Fulfillment"
                    value={toTitleCase(detail.event.fulfillmentMethod)}
                  />
                  <DetailRow
                    label="Serving target"
                    value={detail.event.servingTarget ?? "Not shared"}
                  />
                  <DetailRow
                    label="Guest count"
                    value={detail.event.guestCount ?? "Not shared"}
                  />
                </div>
              </div>

              <div className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Venue and planning
                </p>
                <div className="mt-4">
                  <DetailRow label="Venue" value={detail.event.venueName ?? "Not shared"} />
                  <DetailRow
                    label="Address"
                    value={detail.event.venueAddress ?? "Not shared"}
                  />
                  <DetailRow
                    label="Delivery window"
                    value={detail.event.deliveryWindow ?? "Not shared"}
                  />
                  <DetailRow label="Budget" value={detail.budgetLabel ?? "Not shared"} />
                  <DetailRow
                    label="Estimated range"
                    value={detail.estimatedLabel ?? "Still to be set"}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Customer and signals">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Contact details
                </p>
                <div className="mt-4">
                  <DetailRow label="Email" value={detail.contact.customerEmail} />
                  <DetailRow label="Phone" value={detail.contact.customerPhone} />
                  <DetailRow
                    label="Preferred contact"
                    value={toTitleCase(detail.contact.preferredContact)}
                  />
                  <DetailRow
                    label="Instagram"
                    value={detail.contact.instagramHandle ?? "Not shared"}
                  />
                </div>
              </div>

              <div className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Review signals
                </p>
                <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getSignalClasses(detail.clarityValue)}`}
                  >
                    Clarity: {detail.clarityLabel}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getSignalClasses(detail.priorityValue)}`}
                  >
                    Priority: {detail.priorityLabel}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getSignalClasses(detail.urgencyValue)}`}
                  >
                    Timing: {detail.urgencyLabel}
                  </span>
                </div>
                <div className="mt-4 min-w-0 space-y-2 text-sm leading-7 text-charcoal/68">
                  {detail.colorPalette ? <p className={userTextClass}>Palette: {detail.colorPalette}</p> : null}
                  {detail.howDidYouHear ? <p className={userTextClass}>Lead source: {detail.howDidYouHear}</p> : null}
                  {detail.dietaryNotes ? <p className={userTextClass}>Dietary notes: {detail.dietaryNotes}</p> : null}
                  {detail.additionalNotes ? <p className={userTextClass}>Extra notes: {detail.additionalNotes}</p> : null}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Requested items">
            <div className="space-y-4">
              {detail.items.map((item) => (
                <article
                  key={item.id}
                  className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/10 bg-ivory/70 p-5"
                >
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className={cn("text-lg font-semibold text-charcoal", compactTextClass)}>{item.productLabel}</h3>
                      <p className={cn("mt-1 text-sm text-charcoal/62", compactTextClass)}>{item.requestedQuantityLabel}</p>
                    </div>
                    <div className={cn("text-sm text-charcoal/62", compactTextClass)}>
                      {item.estimatedLabel ?? "Estimate still open"}
                    </div>
                  </div>
                  <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                    <div className="min-w-0 space-y-2 text-sm leading-7 text-charcoal/68">
                      {item.sizeLabel ? <p className={userTextClass}>Size: {item.sizeLabel}</p> : null}
                      {item.shapeLabel ? <p className={userTextClass}>Shape: {item.shapeLabel}</p> : null}
                      {item.icingStyleLabel ? <p className={userTextClass}>Icing style: {item.icingStyleLabel}</p> : null}
                      {item.flavorNotes ? <p className={userTextClass}>Flavor notes: {item.flavorNotes}</p> : null}
                      {item.colorPalette ? <p className={userTextClass}>Palette: {item.colorPalette}</p> : null}
                    </div>
                    <div className="min-w-0 space-y-2 text-sm leading-7 text-charcoal/68">
                      {item.designNotes ? <p className={userTextClass}>Design notes: {item.designNotes}</p> : null}
                      {item.inspirationNotes ? (
                        <p className={userTextClass}>Inspiration notes: {item.inspirationNotes}</p>
                      ) : null}
                      {item.detailSummary ? <p className={userTextClass}>Summary: {item.detailSummary}</p> : null}
                      {item.topperText ? <p className={userTextClass}>Topper text: {item.topperText}</p> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
        <div className="min-w-0 space-y-6">
          {detail.assets.length > 0 ? (
            <SectionCard title="Inspiration and uploads">
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                {detail.assets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Estimate insight">
            <div className="space-y-4">
              <div className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Internal pricing view
                </p>
                <p className={cn("mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal", compactTextClass)}>
                  {detail.estimateInsight.totalLabel ?? "Still to be set"}
                </p>
                <p className={cn("mt-3 text-sm leading-7 text-charcoal/68", userTextClass)}>
                  {detail.estimateInsight.summary}
                </p>
                {detail.estimateInsight.deliveryLabel ? (
                  <p className={cn("mt-3 text-sm leading-7 text-charcoal/68", userTextClass)}>
                    Delivery contribution:{" "}
                    <span className="font-medium text-charcoal">
                      {detail.estimateInsight.deliveryLabel}
                    </span>
                  </p>
                ) : null}
                <p className={cn("mt-4 rounded-[1.1rem] border border-gold/20 bg-gold/6 px-3.5 py-2.5 text-[13px] leading-6 text-charcoal/70", userTextClass)}>
                  {detail.estimateInsight.rationaleNote}
                </p>
              </div>

              <div className="space-y-3">
                {detail.estimateInsight.lineItems.map((item) => (
                  <article
                    key={item.id}
                    className="min-w-0 max-w-full rounded-[1.4rem] border border-charcoal/8 bg-white/82 p-4"
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium text-charcoal", compactTextClass)}>{item.productLabel}</p>
                        <p className={cn("mt-1 text-sm text-charcoal/60", compactTextClass)}>
                          {item.requestedQuantityLabel}
                        </p>
                      </div>
                      <p className={cn("text-sm font-medium text-charcoal", compactTextClass)}>
                        {item.estimatedLabel ?? "Estimate pending"}
                      </p>
                    </div>
                    <div className="mt-3 min-w-0 space-y-2 text-sm leading-7 text-charcoal/66">
                      {item.drivers.map((driver) => (
                        <p key={driver} className={userTextClass}>{driver}</p>
                      ))}
                      {item.detailSummary ? <p className={userTextClass}>Stored summary: {item.detailSummary}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </SectionCard>

          <div id="convert-to-order" className="scroll-mt-6">
            <SectionCard title="Convert to order">
            {conversion?.existingOrder ? (
              <div className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getOrderStatusClasses(conversion.existingOrder.status)}`}
                  >
                    {toTitleCase(conversion.existingOrder.status)}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getPaymentStatusClasses(conversion.existingOrder.paymentStatus)}`}
                  >
                    {toTitleCase(conversion.existingOrder.paymentStatus)}
                  </span>
                </div>
                <p className={cn("mt-4 text-sm leading-8 text-charcoal/70", userTextClass)}>
                  This inquiry has already been converted into an order. Continue the workflow from
                  the linked order and customer records below.
                </p>
                <div className="mt-4 flex min-w-0 flex-wrap gap-3">
                  <Link
                    href={`/admin/orders/${conversion.existingOrder.id}`}
                    className="inline-flex min-h-12 min-w-0 max-w-full items-center justify-center rounded-full bg-charcoal px-5 py-2 text-center text-sm font-medium tracking-[0.02em] text-ivory shadow-soft transition hover:bg-charcoal/90"
                  >
                    Open linked order
                  </Link>
                  {conversion.linkedCustomer ? (
                    <Link
                      href={`/admin/customers/${conversion.linkedCustomer.id}`}
                      className="inline-flex min-h-12 min-w-0 max-w-full items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 py-2 text-center text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
                    >
                      Open linked customer
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <form action={createOrderFromInquiry} className="min-w-0 max-w-full space-y-5">
                <input type="hidden" name="inquiryId" value={detail.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <div className={cn("min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5 text-sm leading-8 text-charcoal/70", userTextClass)}>
                  This creates a manual-first order from the inquiry’s event details and requested
                  items. You can finish pricing, payment records, Square references, and bakery
                  notes after conversion on the order detail page.
                </div>

                <div className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-white/82 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    Customer handling
                  </p>
                  <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <Label htmlFor="customerAction">Create or link customer</Label>
                      <Select
                        id="customerAction"
                        name="customerAction"
                        defaultValue={conversion?.defaultCustomerId ? "link" : "create"}
                      >
                        <option value="create">Create a customer from this inquiry</option>
                        <option value="link">Link an existing customer</option>
                      </Select>
                    </div>

                    <div className="min-w-0">
                      <Label htmlFor="existingCustomerId">Existing customer</Label>
                      <Select
                        id="existingCustomerId"
                        name="existingCustomerId"
                        defaultValue={conversion?.defaultCustomerId ?? ""}
                      >
                        <option value="">Choose a customer if linking</option>
                        {conversion?.customerOptions.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.label}
                            {customer.isLinked
                              ? " • already linked"
                              : customer.isSuggested
                                ? " • suggested match"
                                : ""}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 min-w-0 space-y-2 text-sm leading-7 text-charcoal/66">
                    {conversion?.linkedCustomer ? (
                      <p className={userTextClass}>
                        Current linked customer:{" "}
                        <span className="font-medium text-charcoal">
                          {conversion.linkedCustomer.label}
                        </span>
                      </p>
                    ) : null}
                    {conversion?.matchedCustomerIds.length ? (
                      <p className={userTextClass}>Suggested matches were found using the inquiry name, email, or phone.</p>
                    ) : (
                      <p className={userTextClass}>
                        No likely matches were found yet, so creating a fresh customer is usually
                        the cleanest choice.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="min-w-0">
                    <Label htmlFor="orderStatus">Starting order status</Label>
                    <Select
                      id="orderStatus"
                      name="orderStatus"
                      defaultValue={conversion?.suggestedOrderStatus ?? "draft"}
                    >
                      <option value="draft">Draft</option>
                      <option value="quoted">Quoted</option>
                      <option value="confirmed">Confirmed</option>
                    </Select>
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="estimatedTotalAmount">Estimate total</Label>
                    <Input
                      id="estimatedTotalAmount"
                      name="estimatedTotalAmount"
                      inputMode="decimal"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="totalAmount">Final total</Label>
                    <Input
                      id="totalAmount"
                      name="totalAmount"
                      inputMode="decimal"
                      placeholder="Optional for now"
                    />
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="depositDueAmount">Deposit required</Label>
                    <Input
                      id="depositDueAmount"
                      name="depositDueAmount"
                      inputMode="decimal"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="depositDueAt">Deposit due date</Label>
                    <Input id="depositDueAt" name="depositDueAt" type="date" />
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="finalDueAt">Final due date</Label>
                    <Input id="finalDueAt" name="finalDueAt" type="date" />
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <Label htmlFor="fulfillmentNotes">Pickup or delivery notes</Label>
                    <Textarea
                      id="fulfillmentNotes"
                      name="fulfillmentNotes"
                      placeholder="Parking notes, pickup timing, or delivery handoff details."
                    />
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="internalSummary">Internal summary</Label>
                    <Textarea
                      id="internalSummary"
                      name="internalSummary"
                      placeholder="A short bakery-side summary for the new order."
                    />
                  </div>
                </div>

                <Button type="submit" className="max-w-full text-center">
                  Create order from inquiry
                </Button>
              </form>
            )}
          </SectionCard>
          </div>

          <SectionCard title="Archive and reference">
            <div className="min-w-0 max-w-full rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
              {detail.timestamps.map((item) => (
                <DetailRow
                  key={item.label}
                  label={item.label}
                  value={formatDateTime(item.value)}
                />
              ))}
              <DetailRow label="Reference code" value={detail.referenceCode} />
              <DetailRow label="Source" value={toTitleCase(detail.sourceChannel)} />
            </div>

            <div className="mt-5 min-w-0 max-w-full rounded-[1.6rem] border border-rose/20 bg-rose/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                Delete inquiry
              </p>
              <p className={cn("mt-3 text-sm leading-7 text-charcoal/68", userTextClass)}>
                This permanently removes the inquiry, notes, uploads, and request details from the
                desk. Any linked order record stays intact but becomes unlinked from this inquiry.
              </p>
              <form action={deleteInquiry} className="mt-4">
                <input type="hidden" name="inquiryId" value={detail.id} />
                <input type="hidden" name="redirectTo" value="/admin/inquiries" />
                <ConfirmSubmitButton
                  type="submit"
                  variant="secondary"
                  className="w-full border-rose/30 bg-white text-rose-700 hover:border-rose/45 hover:bg-rose/10 sm:w-auto"
                  confirmMessage="Delete this inquiry permanently? This cannot be undone."
                >
                  Delete inquiry
                </ConfirmSubmitButton>
              </form>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
