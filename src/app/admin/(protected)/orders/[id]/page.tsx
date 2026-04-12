import Link from "next/link";
import { notFound } from "next/navigation";

import { addOrderNote, addOrderPayment, updateOrderDetails, updateOrderPayment } from "@/app/admin/(protected)/orders/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getOrderDetail } from "@/lib/admin/orders";
import {
  formatOptionalDateTime,
  getDateInputValue,
  getOrderStatusClasses,
  getPaymentRecordStatusClasses,
  getPaymentStatusClasses,
  formatOrderMoneySummary,
} from "@/lib/admin/order-workflow";
import { formatDate, toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Order Detail",
};

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function SectionCard({
  children,
  title,
}: Readonly<{
  children: React.ReactNode;
  title: string;
}>) {
  return (
    <section className="rounded-[1.75rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft sm:p-5">
      <h2 className="font-serif text-[2rem] tracking-[-0.04em] text-charcoal sm:text-[2.1rem]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
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
      text: "Order note saved.",
    },
    "note-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The note could not be saved. Please try again.",
    },
    "order-created": {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Order created from the inquiry.",
    },
    "order-created-linked": {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Order created and linked to an existing customer match.",
    },
    "order-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The order update did not save. Please try again.",
    },
    "order-exists": {
      className: "border-gold/25 bg-gold/12 text-charcoal",
      text: "This inquiry already has an order. Open the existing order below.",
    },
    "order-updated": {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Order details updated.",
    },
    "payment-added": {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Payment record added.",
    },
    "payment-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The payment record could not be saved. Please try again.",
    },
    "payment-updated": {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Payment record updated.",
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

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: AdminOrderDetailPageProps) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const detail = await getOrderDetail(id);

  if (!detail) {
    notFound();
  }

  const noticeValue = rawSearchParams.notice;
  const notice = Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
  const redirectTo = `/admin/orders/${detail.id}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 transition hover:text-charcoal"
          >
            ← Back to orders
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
              ORD-{detail.id.slice(0, 8).toUpperCase()}
            </Badge>
            {detail.inquiry ? (
              <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
                {detail.inquiry.referenceCode}
              </Badge>
            ) : null}
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getOrderStatusClasses(detail.status)}`}
            >
              {toTitleCase(detail.status)}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getPaymentStatusClasses(detail.paymentStatus)}`}
            >
              {toTitleCase(detail.paymentStatus)}
            </span>
          </div>
          <div>
            <h1 className="font-serif text-[2.3rem] tracking-[-0.04em] text-charcoal sm:text-[2.8rem]">
              {detail.customer?.fullName ?? "Order detail"}
            </h1>
            <p className="mt-2 text-sm leading-7 text-charcoal/66">
              {detail.eventType} on {formatDate(detail.eventDate)} via{" "}
              {detail.fulfillmentMethod === "delivery" ? "delivery" : "pickup"}
            </p>
          </div>
        </div>

        <div className="rounded-[1.55rem] border border-charcoal/10 bg-white/88 px-4 py-3 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
            Final total
          </p>
          <p className="mt-2 text-lg font-semibold text-charcoal">
            {formatOrderMoneySummary(detail.totalAmount)}
          </p>
          <p className="mt-2 text-sm text-charcoal/60">
            Balance due: {formatOrderMoneySummary(detail.balanceDueAmount)}
          </p>
        </div>
      </div>

      <NoticeBanner notice={notice} />

      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-4">
          <SectionCard title="Order details">
            <form action={updateOrderDetails} className="space-y-5">
              <input type="hidden" name="orderId" value={detail.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="status">Order status</Label>
                  <Select id="status" name="status" defaultValue={detail.status}>
                    <option value="draft">Draft</option>
                    <option value="quoted">Quoted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in-production">In production</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fulfillmentMethod">Fulfillment</Label>
                  <Select
                    id="fulfillmentMethod"
                    name="fulfillmentMethod"
                    defaultValue={detail.fulfillmentMethod}
                  >
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventType">Event type</Label>
                  <Input id="eventType" name="eventType" defaultValue={detail.eventType} required />
                </div>

                <div>
                  <Label htmlFor="eventDate">Event date</Label>
                  <Input id="eventDate" name="eventDate" type="date" defaultValue={detail.eventDate} required />
                </div>

                <div>
                  <Label htmlFor="venueName">Venue name</Label>
                  <Input id="venueName" name="venueName" defaultValue={detail.venueName ?? ""} />
                </div>

                <div>
                  <Label htmlFor="fulfillmentWindow">Pickup or delivery window</Label>
                  <Input
                    id="fulfillmentWindow"
                    name="fulfillmentWindow"
                    defaultValue={detail.fulfillmentWindow ?? ""}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="venueAddress">Venue address</Label>
                  <Input
                    id="venueAddress"
                    name="venueAddress"
                    defaultValue={detail.venueAddress ?? ""}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="deliveryAddress">Delivery or pickup notes address</Label>
                  <Input
                    id="deliveryAddress"
                    name="deliveryAddress"
                    defaultValue={detail.deliveryAddress ?? ""}
                    placeholder="Use this when delivery details differ from the venue address."
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="estimatedTotalAmount">Estimate total</Label>
                  <Input
                    id="estimatedTotalAmount"
                    name="estimatedTotalAmount"
                    inputMode="decimal"
                    defaultValue={detail.estimatedTotalAmount ?? ""}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="subtotalAmount">Subtotal</Label>
                  <Input
                    id="subtotalAmount"
                    name="subtotalAmount"
                    inputMode="decimal"
                    defaultValue={detail.subtotalAmount}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="totalAmount">Final total</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    inputMode="decimal"
                    defaultValue={detail.totalAmount}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="discountAmount">Discount</Label>
                  <Input
                    id="discountAmount"
                    name="discountAmount"
                    inputMode="decimal"
                    defaultValue={detail.discountAmount}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryFee">Delivery fee</Label>
                  <Input
                    id="deliveryFee"
                    name="deliveryFee"
                    inputMode="decimal"
                    defaultValue={detail.deliveryFee}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="taxAmount">Tax</Label>
                  <Input
                    id="taxAmount"
                    name="taxAmount"
                    inputMode="decimal"
                    defaultValue={detail.taxAmount}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="depositDueAmount">Deposit required</Label>
                  <Input
                    id="depositDueAmount"
                    name="depositDueAmount"
                    inputMode="decimal"
                    defaultValue={detail.depositDueAmount}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="depositDueAt">Deposit due date</Label>
                  <Input
                    id="depositDueAt"
                    name="depositDueAt"
                    type="date"
                    defaultValue={getDateInputValue(detail.depositDueAt)}
                  />
                </div>

                <div>
                  <Label htmlFor="finalDueAt">Final due date</Label>
                  <Input
                    id="finalDueAt"
                    name="finalDueAt"
                    type="date"
                    defaultValue={getDateInputValue(detail.finalDueAt)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="squareInvoiceNumber">Square invoice reference</Label>
                  <Input
                    id="squareInvoiceNumber"
                    name="squareInvoiceNumber"
                    defaultValue={detail.squareInvoiceNumber ?? ""}
                    placeholder="Manual invoice number or label"
                  />
                </div>

                <div>
                  <Label htmlFor="squareInvoiceStatus">Square invoice status</Label>
                  <Input
                    id="squareInvoiceStatus"
                    name="squareInvoiceStatus"
                    defaultValue={detail.squareInvoiceStatus ?? ""}
                    placeholder="Draft, sent, viewed, paid, etc."
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="squareInvoiceUrl">Square invoice link</Label>
                  <Input
                    id="squareInvoiceUrl"
                    name="squareInvoiceUrl"
                    defaultValue={detail.squareInvoiceUrl ?? ""}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="workflowDesignNotes">Order design notes</Label>
                  <Textarea
                    id="workflowDesignNotes"
                    name="workflowDesignNotes"
                    defaultValue={detail.workflowDesignNotes ?? ""}
                    placeholder="Capture the high-level design direction before it turns into a full quote or production plan."
                  />
                </div>

                <div>
                  <Label htmlFor="fulfillmentNotes">Pickup or delivery notes</Label>
                  <Textarea
                    id="fulfillmentNotes"
                    name="fulfillmentNotes"
                    defaultValue={detail.fulfillmentNotes ?? ""}
                    placeholder="Parking notes, pickup timing, setup reminders, or delivery handoff details."
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="internalSummary">Internal summary</Label>
                  <Textarea
                    id="internalSummary"
                    name="internalSummary"
                    defaultValue={detail.internalSummary ?? ""}
                    placeholder="Short internal snapshot for the order at a glance."
                  />
                </div>

                <div>
                  <Label htmlFor="productionNotes">Production notes</Label>
                  <Textarea
                    id="productionNotes"
                    name="productionNotes"
                    defaultValue={detail.productionNotes ?? ""}
                    placeholder="Kitchen timing, pickup packing reminders, or production-only notes."
                  />
                </div>
              </div>

              <Button type="submit">
                Save order details
              </Button>
            </form>
          </SectionCard>

          <SectionCard title="Item breakdown">
            <div className="space-y-4">
              {detail.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.6rem] border border-charcoal/10 bg-ivory/70 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal">{item.productLabel}</h3>
                      <p className="mt-1 text-sm text-charcoal/62">{item.quantityLabel}</p>
                    </div>
                    <div className="text-sm text-charcoal/62">
                      {item.lineTotal !== null
                        ? `Line total ${formatOrderMoneySummary(item.lineTotal)}`
                        : "Line pricing not set yet"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 text-sm leading-7 text-charcoal/70">
                      {item.sizeLabel ? <p>Size: {item.sizeLabel}</p> : null}
                      {item.flavorNotes ? <p>Flavor notes: {item.flavorNotes}</p> : null}
                      {item.colorPalette ? <p>Palette: {item.colorPalette}</p> : null}
                      {item.topperText ? <p>Topper text: {item.topperText}</p> : null}
                      {item.detailSummary ? <p>Summary: {item.detailSummary}</p> : null}
                    </div>
                    <div className="space-y-2 text-sm leading-7 text-charcoal/70">
                      {item.designNotes ? <p>Design notes: {item.designNotes}</p> : null}
                      {item.kitchenNotes ? <p>Kitchen notes: {item.kitchenNotes}</p> : null}
                      {item.unitPrice !== null ? (
                        <p>Unit price: {formatOrderMoneySummary(item.unitPrice)}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Payments">
            <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                Add payment record
              </p>
              <form action={addOrderPayment} className="mt-4 space-y-4">
                <input type="hidden" name="orderId" value={detail.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label htmlFor="paymentUiType">Type</Label>
                    <Select id="paymentUiType" name="paymentUiType" defaultValue="deposit">
                      <option value="deposit">Deposit</option>
                      <option value="final">Final</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" inputMode="decimal" placeholder="0" required />
                  </div>

                  <div>
                    <Label htmlFor="paymentStatus">Status</Label>
                    <Select id="paymentStatus" name="status" defaultValue="pending">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                      <option value="voided">Voided</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="method">Method</Label>
                    <Select id="method" name="method" defaultValue="invoice">
                      <option value="invoice">Invoice</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="bank-transfer">Bank transfer</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueAt">Due date</Label>
                    <Input id="dueAt" name="dueAt" type="date" />
                  </div>

                  <div>
                    <Label htmlFor="paidAt">Paid date</Label>
                    <Input id="paidAt" name="paidAt" type="date" />
                  </div>

                  <div>
                    <Label htmlFor="referenceCode">Reference</Label>
                    <Input id="referenceCode" name="referenceCode" placeholder="Invoice #, cash note, etc." />
                  </div>

                  <div>
                    <Label htmlFor="providerName">Source</Label>
                    <Input id="providerName" name="providerName" placeholder="Square, cash, bank transfer, etc." />
                  </div>

                  <div>
                    <Label htmlFor="providerIntentId">Source detail</Label>
                    <Input id="providerIntentId" name="providerIntentId" placeholder="Manual external reference" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentNotes">Notes</Label>
                  <Textarea
                    id="paymentNotes"
                    name="notes"
                    placeholder="Manual context for the payment record, like who sent it or what it covered."
                  />
                </div>

                <Button type="submit">Add payment</Button>
              </form>
            </div>

            <div className="mt-5 space-y-4">
              {detail.payments.length > 0 ? (
                detail.payments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-[1.6rem] border border-charcoal/10 bg-white/82 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getPaymentRecordStatusClasses(payment.status)}`}
                      >
                        {toTitleCase(payment.status)}
                      </span>
                      <span className="text-sm font-medium text-charcoal">{payment.typeLabel}</span>
                    </div>

                    <form action={updateOrderPayment} className="mt-4 space-y-4">
                      <input type="hidden" name="orderId" value={detail.id} />
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <Label>Type</Label>
                          <Select name="paymentUiType" defaultValue={payment.uiType}>
                            <option value="deposit">Deposit</option>
                            <option value="final">Final</option>
                            <option value="other">Other</option>
                          </Select>
                        </div>

                        <div>
                          <Label>Amount</Label>
                          <Input name="amount" inputMode="decimal" defaultValue={payment.amount} />
                        </div>

                        <div>
                          <Label>Status</Label>
                          <Select name="status" defaultValue={payment.status}>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                            <option value="voided">Voided</option>
                          </Select>
                        </div>

                        <div>
                          <Label>Method</Label>
                          <Select name="method" defaultValue={payment.method}>
                            <option value="invoice">Invoice</option>
                            <option value="card">Card</option>
                            <option value="cash">Cash</option>
                            <option value="bank-transfer">Bank transfer</option>
                            <option value="other">Other</option>
                          </Select>
                        </div>

                        <div>
                          <Label>Due date</Label>
                          <Input name="dueAt" type="date" defaultValue={getDateInputValue(payment.dueAt)} />
                        </div>

                        <div>
                          <Label>Paid date</Label>
                          <Input name="paidAt" type="date" defaultValue={getDateInputValue(payment.paidAt)} />
                        </div>

                        <div>
                          <Label>Reference</Label>
                          <Input name="referenceCode" defaultValue={payment.referenceCode ?? ""} />
                        </div>

                        <div>
                          <Label>Source</Label>
                          <Input name="providerName" defaultValue={payment.providerName ?? ""} />
                        </div>

                        <div>
                          <Label>Source detail</Label>
                          <Input
                            name="providerIntentId"
                            defaultValue={payment.providerIntentId ?? ""}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Textarea name="notes" defaultValue={payment.notes ?? ""} />
                      </div>

                      <Button type="submit" variant="secondary">
                        Update payment
                      </Button>
                    </form>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-charcoal/62">
                  No payment records yet. Add deposit, final, or other manual payment entries as
                  the order moves forward.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Internal notes">
            <form action={addOrderNote} className="space-y-4">
              <input type="hidden" name="orderId" value={detail.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div>
                <Label htmlFor="noteBody">Add a note</Label>
                <Textarea
                  id="noteBody"
                  name="noteBody"
                  placeholder="Capture follow-up details, production decisions, or anything the next pass should know."
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

              <Button type="submit">
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
                        {formatOptionalDateTime(note.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-8 text-charcoal/72">{note.noteBody}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-charcoal/62">
                  No internal notes yet. Add one so the next production or follow-up pass has
                  context.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Linked records">
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Customer
                </p>
                {detail.customer ? (
                  <>
                    <p className="mt-3 text-lg font-semibold text-charcoal">
                      {detail.customer.fullName}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-charcoal/68">
                      {detail.customer.email ?? "No email yet"}
                      <br />
                      {detail.customer.phone ?? "No phone yet"}
                      <br />
                      Preferred contact: {toTitleCase(detail.customer.preferredContact)}
                    </p>
                    <Link
                      href={`/admin/customers/${detail.customer.id}`}
                      className="mt-4 inline-flex text-sm font-medium text-charcoal underline decoration-gold/60 underline-offset-4"
                    >
                      Open customer record
                    </Link>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-charcoal/62">
                    This order is missing a linked customer record.
                  </p>
                )}
              </div>

              <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Originating inquiry
                </p>
                {detail.inquiry ? (
                  <>
                    <p className="mt-3 text-lg font-semibold text-charcoal">
                      {detail.inquiry.referenceCode}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-charcoal/68">
                      {detail.inquiry.customerName}
                      <br />
                      {detail.inquiry.customerEmail}
                      <br />
                      Submitted {formatDate(detail.inquiry.submittedAt)}
                    </p>
                    <Link
                      href={`/admin/inquiries/${detail.inquiry.id}`}
                      className="mt-4 inline-flex text-sm font-medium text-charcoal underline decoration-gold/60 underline-offset-4"
                    >
                      Open inquiry
                    </Link>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-charcoal/62">
                    No inquiry is linked to this order.
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Payment summary">
            <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
              <DetailRow
                label="Deposit required"
                value={formatOrderMoneySummary(detail.depositDueAmount)}
              />
              <DetailRow
                label="Deposit paid"
                value={formatOrderMoneySummary(detail.paymentSummary.depositPaid)}
              />
              <DetailRow
                label="Final paid"
                value={formatOrderMoneySummary(detail.paymentSummary.finalPaid)}
              />
              <DetailRow
                label="Other paid"
                value={formatOrderMoneySummary(detail.paymentSummary.otherPaid)}
              />
              <DetailRow
                label="Total paid"
                value={formatOrderMoneySummary(detail.paymentSummary.totalPaid)}
              />
              <DetailRow
                label="Balance due"
                value={formatOrderMoneySummary(detail.balanceDueAmount)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Timestamps">
            <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
              {detail.timestamps.map((item) => (
                <DetailRow
                  key={item.label}
                  label={item.label}
                  value={formatOptionalDateTime(item.value)}
                />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
