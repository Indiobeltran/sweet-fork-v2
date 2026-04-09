import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { addInquiryNote, updateInquiryStatus } from "@/app/admin/(protected)/inquiries/actions";
import { createOrderFromInquiry } from "@/app/admin/(protected)/orders/actions";
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
import { formatDate, toTitleCase } from "@/lib/utils";
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
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
    <section className="rounded-[2rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft sm:p-6">
      <h2 className="font-serif text-3xl tracking-[-0.04em] text-charcoal">{title}</h2>
      <div className="mt-5">{children}</div>
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
    <div className="flex items-start justify-between gap-5 border-b border-charcoal/8 py-3 last:border-none last:pb-0">
      <p className="text-sm text-charcoal/55">{label}</p>
      <div className="max-w-[70%] text-right text-sm font-medium text-charcoal">{value}</div>
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
    <div className="overflow-hidden rounded-[1.6rem] border border-charcoal/10 bg-ivory/70">
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
        <p className="text-sm font-medium text-charcoal">{asset.label}</p>
        {asset.originalFilename ? (
          <p className="text-xs uppercase tracking-[0.16em] text-charcoal/45">
            {asset.originalFilename}
          </p>
        ) : null}
        {asset.textContent ? (
          <p className="text-sm leading-7 text-charcoal/70">{asset.textContent}</p>
        ) : null}
        {asset.url ? (
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-charcoal underline decoration-gold/60 underline-offset-4"
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 transition hover:text-charcoal"
          >
            ← Back to inquiries
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
              {detail.referenceCode}
            </Badge>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(detail.status)}`}
            >
              {toTitleCase(detail.status)}
            </span>
          </div>
          <div>
            <h1 className="font-serif text-4xl tracking-[-0.04em] text-charcoal sm:text-5xl">
              {detail.contact.customerName}
            </h1>
            <p className="mt-2 text-sm leading-7 text-charcoal/66">
              {detail.event.eventType} on {formatDate(detail.event.eventDate)} via{" "}
              {detail.event.fulfillmentMethod === "delivery" ? "delivery" : "pickup"}
            </p>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-charcoal/10 bg-white/88 px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
            Submitted
          </p>
          <p className="mt-2 text-sm font-medium text-charcoal">
            {formatDateTime(detail.submittedAt)}
          </p>
          <p className="mt-2 text-sm text-charcoal/60">
            Estimate: {detail.estimatedLabel ?? "Still to be set"}
          </p>
        </div>
      </div>

      <NoticeBanner notice={notice} />

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-6">
          <SectionCard title="Event details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
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

              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
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

              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Review signals
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
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
                <div className="mt-4 space-y-2 text-sm leading-7 text-charcoal/68">
                  {detail.colorPalette ? <p>Palette: {detail.colorPalette}</p> : null}
                  {detail.howDidYouHear ? <p>Lead source: {detail.howDidYouHear}</p> : null}
                  {detail.dietaryNotes ? <p>Dietary notes: {detail.dietaryNotes}</p> : null}
                  {detail.additionalNotes ? <p>Extra notes: {detail.additionalNotes}</p> : null}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Requested items">
            <div className="space-y-4">
              {detail.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.6rem] border border-charcoal/10 bg-ivory/70 p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal">{item.productLabel}</h3>
                      <p className="mt-1 text-sm text-charcoal/62">{item.requestedQuantityLabel}</p>
                    </div>
                    <div className="text-sm text-charcoal/62">
                      {item.estimatedLabel ?? "Estimate still open"}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 text-sm leading-7 text-charcoal/68">
                      {item.sizeLabel ? <p>Size: {item.sizeLabel}</p> : null}
                      {item.shapeLabel ? <p>Shape: {item.shapeLabel}</p> : null}
                      {item.icingStyleLabel ? <p>Icing style: {item.icingStyleLabel}</p> : null}
                      {item.flavorNotes ? <p>Flavor notes: {item.flavorNotes}</p> : null}
                      {item.colorPalette ? <p>Palette: {item.colorPalette}</p> : null}
                    </div>
                    <div className="space-y-2 text-sm leading-7 text-charcoal/68">
                      {item.designNotes ? <p>Design notes: {item.designNotes}</p> : null}
                      {item.inspirationNotes ? (
                        <p>Inspiration notes: {item.inspirationNotes}</p>
                      ) : null}
                      {item.detailSummary ? <p>Summary: {item.detailSummary}</p> : null}
                      {item.topperText ? <p>Topper text: {item.topperText}</p> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          {detail.assets.length > 0 ? (
            <SectionCard title="Inspiration and uploads">
              <div className="grid gap-4 md:grid-cols-2">
                {detail.assets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <SectionCard title="Estimate insight">
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Internal pricing view
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  {detail.estimateInsight.totalLabel ?? "Still to be set"}
                </p>
                <p className="mt-3 text-sm leading-7 text-charcoal/68">
                  {detail.estimateInsight.summary}
                </p>
                {detail.estimateInsight.deliveryLabel ? (
                  <p className="mt-3 text-sm leading-7 text-charcoal/68">
                    Delivery contribution:{" "}
                    <span className="font-medium text-charcoal">
                      {detail.estimateInsight.deliveryLabel}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                {detail.estimateInsight.lineItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.4rem] border border-charcoal/8 bg-white/82 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{item.productLabel}</p>
                        <p className="mt-1 text-sm text-charcoal/60">
                          {item.requestedQuantityLabel}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-charcoal">
                        {item.estimatedLabel ?? "Estimate pending"}
                      </p>
                    </div>
                    <div className="mt-3 space-y-2 text-sm leading-7 text-charcoal/66">
                      {item.drivers.map((driver) => (
                        <p key={driver}>{driver}</p>
                      ))}
                      {item.detailSummary ? <p>Stored summary: {item.detailSummary}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Status and reference">
            <form action={updateInquiryStatus} className="space-y-4">
              <input type="hidden" name="inquiryId" value={detail.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div>
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

              <Button type="submit" className="w-full">
                Save status
              </Button>
            </form>

            <div className="mt-5 rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
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
          </SectionCard>

          <SectionCard title="Internal notes">
            <form action={addInquiryNote} className="space-y-4">
              <input type="hidden" name="inquiryId" value={detail.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div>
                <Label htmlFor="noteBody">Add a note</Label>
                <Textarea
                  id="noteBody"
                  name="noteBody"
                  placeholder="Capture follow-up details, quote context, availability checks, or anything the next review pass should know."
                  required
                />
              </div>

              <label className="flex items-center gap-3 rounded-[1.4rem] border border-charcoal/10 bg-ivory/70 px-4 py-3 text-sm text-charcoal/72">
                <input
                  type="checkbox"
                  name="isPinned"
                  className="h-4 w-4 rounded border border-charcoal/20"
                />
                Pin this note near the top
              </label>

              <Button type="submit" className="w-full">
                Save note
              </Button>
            </form>

            <div className="mt-5 space-y-3">
              {detail.notes.length > 0 ? (
                detail.notes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-[1.5rem] border border-charcoal/10 bg-white/82 p-4"
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
                    <p className="mt-3 text-sm leading-8 text-charcoal/72">{note.noteBody}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-charcoal/62">
                  No internal notes yet. Add one to capture follow-up context for the next pass.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Convert to order">
            {conversion?.existingOrder ? (
              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <div className="flex flex-wrap items-center gap-2">
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
                <p className="mt-4 text-sm leading-8 text-charcoal/70">
                  This inquiry has already been converted into an order. Continue the workflow from
                  the linked order and customer records below.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/admin/orders/${conversion.existingOrder.id}`}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-medium tracking-[0.02em] text-ivory shadow-soft transition hover:bg-charcoal/90"
                  >
                    Open linked order
                  </Link>
                  {conversion.linkedCustomer ? (
                    <Link
                      href={`/admin/customers/${conversion.linkedCustomer.id}`}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
                    >
                      Open linked customer
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <form action={createOrderFromInquiry} className="space-y-5">
                <input type="hidden" name="inquiryId" value={detail.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5 text-sm leading-8 text-charcoal/70">
                  This creates a manual-first order from the inquiry’s event details and requested
                  items. You can finish pricing, payment records, Square references, and bakery
                  notes after conversion on the order detail page.
                </div>

                <div className="rounded-[1.6rem] border border-charcoal/8 bg-white/82 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    Customer handling
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
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

                    <div>
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

                  <div className="mt-4 space-y-2 text-sm leading-7 text-charcoal/66">
                    {conversion?.linkedCustomer ? (
                      <p>
                        Current linked customer:{" "}
                        <span className="font-medium text-charcoal">
                          {conversion.linkedCustomer.label}
                        </span>
                      </p>
                    ) : null}
                    {conversion?.matchedCustomerIds.length ? (
                      <p>Suggested matches were found using the inquiry name, email, or phone.</p>
                    ) : (
                      <p>
                        No likely matches were found yet, so creating a fresh customer is usually
                        the cleanest choice.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
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

                  <div>
                    <Label htmlFor="estimatedTotalAmount">Estimate total</Label>
                    <Input
                      id="estimatedTotalAmount"
                      name="estimatedTotalAmount"
                      inputMode="decimal"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="totalAmount">Final total</Label>
                    <Input
                      id="totalAmount"
                      name="totalAmount"
                      inputMode="decimal"
                      placeholder="Optional for now"
                    />
                  </div>

                  <div>
                    <Label htmlFor="depositDueAmount">Deposit required</Label>
                    <Input
                      id="depositDueAmount"
                      name="depositDueAmount"
                      inputMode="decimal"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="depositDueAt">Deposit due date</Label>
                    <Input id="depositDueAt" name="depositDueAt" type="date" />
                  </div>

                  <div>
                    <Label htmlFor="finalDueAt">Final due date</Label>
                    <Input id="finalDueAt" name="finalDueAt" type="date" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="fulfillmentNotes">Pickup or delivery notes</Label>
                    <Textarea
                      id="fulfillmentNotes"
                      name="fulfillmentNotes"
                      placeholder="Parking notes, pickup timing, or delivery handoff details."
                    />
                  </div>

                  <div>
                    <Label htmlFor="internalSummary">Internal summary</Label>
                    <Textarea
                      id="internalSummary"
                      name="internalSummary"
                      placeholder="A short bakery-side summary for the new order."
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto">
                  Create order from inquiry
                </Button>
              </form>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
