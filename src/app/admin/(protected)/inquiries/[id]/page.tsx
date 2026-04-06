import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addInquiryNote, updateInquiryStatus } from "@/app/admin/(protected)/inquiries/actions";
import {
  getInquiryDetail,
  type InquiryAssetDisplay,
  type InquirySignalClarity,
  type InquirySignalPriority,
  type InquirySignalUrgency,
} from "@/lib/admin/inquiries";
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
        <p className="text-xs uppercase tracking-[0.16em] text-charcoal/45">
          {asset.originalFilename ?? "Private inspiration upload"}
        </p>
        {asset.note ? <p className="text-sm leading-7 text-charcoal/62">{asset.note}</p> : null}
        {asset.signedUrl ? (
          <a
            href={asset.signedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-charcoal underline decoration-gold/60 underline-offset-4"
          >
            Open full preview
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
  const detail = await getInquiryDetail(id);

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
                    value={detail.event.fulfillmentMethod === "delivery" ? "Delivery" : "Pickup"}
                  />
                  <DetailRow
                    label="Delivery window"
                    value={detail.event.deliveryWindow ?? "Not needed yet"}
                  />
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Size and venue
                </p>
                <div className="mt-4">
                  <DetailRow
                    label="Guest count"
                    value={detail.event.guestCount ?? "Not shared"}
                  />
                  <DetailRow
                    label="Serving target"
                    value={detail.event.servingTarget ?? "Not shared"}
                  />
                  <DetailRow label="Venue" value={detail.event.venueName ?? "Not shared"} />
                  <DetailRow
                    label="Address"
                    value={detail.event.venueAddress ?? "Not shared"}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-charcoal/8 bg-white/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Budget and estimate
                </p>
                <div className="mt-4">
                  <DetailRow label="Budget range" value={detail.budgetLabel ?? "Not shared"} />
                  <DetailRow
                    label="Estimate range"
                    value={detail.estimatedLabel ?? "Still to be set"}
                  />
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-charcoal/8 bg-white/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Notes from intake
                </p>
                <div className="mt-4">
                  <DetailRow
                    label="Dietary notes"
                    value={detail.dietaryNotes ?? "None shared"}
                  />
                  <DetailRow
                    label="Color palette"
                    value={detail.colorPalette ?? "Not shared"}
                  />
                  <DetailRow
                    label="Additional notes"
                    value={detail.additionalNotes ?? "None shared"}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Selected products">
            <div className="space-y-4">
              {detail.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.8rem] border border-charcoal/10 bg-ivory/75 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                        {toTitleCase(item.productType)}
                      </p>
                      <h3 className="mt-2 font-serif text-2xl tracking-[-0.03em] text-charcoal">
                        {item.productLabel}
                      </h3>
                      <p className="mt-2 text-sm text-charcoal/66">{item.requestedQuantityLabel}</p>
                    </div>

                    <div className="rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-medium text-charcoal">
                      {item.estimatedLabel ?? "Estimate not set"}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3 rounded-[1.4rem] border border-charcoal/8 bg-white/78 p-4">
                      <DetailRow label="Size" value={item.sizeLabel ?? "Open"} />
                      <DetailRow label="Shape" value={item.shapeLabel ?? "Open"} />
                      <DetailRow
                        label="Finish"
                        value={item.icingStyleLabel ?? "Open"}
                      />
                      <DetailRow
                        label="Color notes"
                        value={item.colorPalette ?? "None shared"}
                      />
                    </div>

                    <div className="space-y-3 rounded-[1.4rem] border border-charcoal/8 bg-white/78 p-4">
                      <DetailRow
                        label="Flavor notes"
                        value={item.flavorNotes ?? "None shared"}
                      />
                      <DetailRow
                        label="Design notes"
                        value={item.designNotes ?? "None shared"}
                      />
                      <DetailRow
                        label="Inspiration notes"
                        value={item.inspirationNotes ?? "None shared"}
                      />
                      <DetailRow
                        label="Topper text"
                        value={item.topperText ?? "None shared"}
                      />
                    </div>
                  </div>

                  {item.detailSummary ? (
                    <p className="mt-4 text-sm leading-7 text-charcoal/66">{item.detailSummary}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Inspiration and references">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Uploads
                </h3>
                {detail.uploads.length > 0 ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {detail.uploads.map((asset) => (
                      <AssetCard key={asset.id} asset={asset} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-charcoal/62">
                    No image uploads were attached to this inquiry.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Reference links
                </h3>
                {detail.inspirationLinks.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {detail.inspirationLinks.map((asset) => (
                      <a
                        key={asset.id}
                        href={asset.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[1.5rem] border border-charcoal/10 bg-ivory/70 px-4 py-4 text-sm leading-7 text-charcoal transition hover:border-charcoal/25"
                      >
                        <span className="block font-medium">{asset.label}</span>
                        <span className="block break-all text-charcoal/66">{asset.url}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-charcoal/62">
                    No external reference links were included.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Reference text
                </h3>
                {detail.inspirationTextBlocks.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {detail.inspirationTextBlocks.map((asset) => (
                      <div
                        key={asset.id}
                        className="rounded-[1.5rem] border border-charcoal/10 bg-white/82 p-5"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                          {asset.label}
                        </p>
                        <p className="mt-3 text-sm leading-8 text-charcoal/72">
                          {asset.textContent}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-charcoal/62">
                    No written inspiration notes were included.
                  </p>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Contact and signals">
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <div>
                  <DetailRow label="Email" value={detail.contact.customerEmail} />
                  <DetailRow label="Phone" value={detail.contact.customerPhone} />
                  <DetailRow
                    label="Instagram"
                    value={detail.contact.instagramHandle ?? "Not shared"}
                  />
                  <DetailRow
                    label="Preferred contact"
                    value={toTitleCase(detail.contact.preferredContact)}
                  />
                  <DetailRow
                    label="How they heard"
                    value={detail.howDidYouHear ?? "Not shared"}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <div
                  className={`rounded-[1.4rem] border px-4 py-4 ${getSignalClasses(detail.clarityValue)}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    Clarity placeholder
                  </p>
                  <p className="mt-2 text-sm font-medium text-charcoal">{detail.clarityLabel}</p>
                </div>
                <div
                  className={`rounded-[1.4rem] border px-4 py-4 ${getSignalClasses(detail.priorityValue)}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    Priority placeholder
                  </p>
                  <p className="mt-2 text-sm font-medium text-charcoal">{detail.priorityLabel}</p>
                </div>
                <div
                  className={`rounded-[1.4rem] border px-4 py-4 ${getSignalClasses(detail.urgencyValue)}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    Timing placeholder
                  </p>
                  <p className="mt-2 text-sm font-medium text-charcoal">{detail.urgencyLabel}</p>
                </div>
              </div>

              {detail.internalSummary ? (
                <div className="rounded-[1.6rem] border border-charcoal/8 bg-white/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    Internal summary
                  </p>
                  <p className="mt-3 text-sm leading-8 text-charcoal/70">{detail.internalSummary}</p>
                </div>
              ) : null}
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
            <div className="rounded-[1.6rem] border border-dashed border-charcoal/18 bg-ivory/65 p-5">
              <p className="text-sm leading-8 text-charcoal/70">{detail.convertToOrderNote}</p>
              <div className="mt-4">
                <Button type="button" variant="secondary" disabled aria-disabled="true">
                  Convert to order in next phase
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
