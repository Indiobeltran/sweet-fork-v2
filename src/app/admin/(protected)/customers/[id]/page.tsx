import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCustomerDetails } from "@/app/admin/(protected)/customers/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCustomerDetail } from "@/lib/admin/customers";
import {
  formatOptionalDateTime,
  getOrderStatusClasses,
  getPaymentStatusClasses,
} from "@/lib/admin/order-workflow";
import { formatDate, toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Customer Detail",
};

type AdminCustomerDetailPageProps = {
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
    <section className="rounded-[2rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft sm:p-6">
      <h2 className="font-serif text-3xl tracking-[-0.04em] text-charcoal">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function NoticeBanner({ notice }: { notice: string | undefined }) {
  if (!notice) {
    return null;
  }

  const copyByNotice: Record<string, { className: string; text: string }> = {
    "customer-error": {
      className: "border-rose/24 bg-rose/10 text-charcoal",
      text: "The customer record could not be updated. Please try again.",
    },
    "customer-updated": {
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      text: "Customer details updated.",
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

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: AdminCustomerDetailPageProps) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const detail = await getCustomerDetail(id);

  if (!detail) {
    notFound();
  }

  const noticeValue = rawSearchParams.notice;
  const notice = Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
  const redirectTo = `/admin/customers/${detail.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 transition hover:text-charcoal"
          >
            ← Back to customers
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
              {detail.orderCount} order{detail.orderCount === 1 ? "" : "s"}
            </Badge>
            <span className="rounded-full border border-charcoal/10 bg-ivory/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/75">
              {detail.repeatLabel}
            </span>
          </div>
          <div>
            <h1 className="font-serif text-4xl tracking-[-0.04em] text-charcoal sm:text-5xl">
              {detail.fullName}
            </h1>
            <p className="mt-2 text-sm leading-7 text-charcoal/66">
              Preferred contact: {toTitleCase(detail.preferredContact)}
            </p>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-charcoal/10 bg-white/88 px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
            Last activity
          </p>
          <p className="mt-2 text-sm font-medium text-charcoal">
            Order: {formatOptionalDateTime(detail.lastOrderAt)}
          </p>
          <p className="mt-2 text-sm text-charcoal/60">
            Inquiry: {formatOptionalDateTime(detail.lastInquiryAt)}
          </p>
        </div>
      </div>

      <NoticeBanner notice={notice} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionCard title="Customer details">
            <form action={updateCustomerDetails} className="space-y-5">
              <input type="hidden" name="customerId" value={detail.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" defaultValue={detail.fullName} required />
                </div>

                <div>
                  <Label htmlFor="preferredContact">Preferred contact</Label>
                  <Select
                    id="preferredContact"
                    name="preferredContact"
                    defaultValue={detail.preferredContact}
                  >
                    <option value="email">Email</option>
                    <option value="text">Text</option>
                    <option value="phone">Phone</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" defaultValue={detail.email ?? ""} />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={detail.phone ?? ""} />
                </div>

                <div>
                  <Label htmlFor="instagramHandle">Instagram</Label>
                  <Input
                    id="instagramHandle"
                    name="instagramHandle"
                    defaultValue={detail.instagramHandle ?? ""}
                  />
                </div>

                <div>
                  <Label htmlFor="defaultFulfillmentMethod">Default fulfillment</Label>
                  <Select
                    id="defaultFulfillmentMethod"
                    name="defaultFulfillmentMethod"
                    defaultValue={detail.defaultFulfillmentMethod ?? ""}
                  >
                    <option value="">No default yet</option>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="leadSource">Lead source</Label>
                  <Input
                    id="leadSource"
                    name="leadSource"
                    defaultValue={detail.leadSource ?? ""}
                    placeholder="Referral, Instagram, phone, event, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={detail.notes ?? ""}
                  placeholder="Manual customer notes, repeat preferences, delivery quirks, or special relationship context."
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                Save customer details
              </Button>
            </form>
          </SectionCard>

          <SectionCard title="Linked order history">
            {detail.orders.length > 0 ? (
              <div className="space-y-4">
                {detail.orders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[1.6rem] border border-charcoal/10 bg-ivory/70 p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getOrderStatusClasses(order.status)}`}
                          >
                            {toTitleCase(order.status)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getPaymentStatusClasses(order.paymentStatus)}`}
                          >
                            {toTitleCase(order.paymentStatus)}
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-charcoal">
                          {order.eventType}
                        </h3>
                        <p className="mt-1 text-sm leading-7 text-charcoal/66">
                          {formatDate(order.eventDate)} via{" "}
                          {order.fulfillmentMethod === "delivery" ? "delivery" : "pickup"}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <p className="text-sm font-medium text-charcoal">{order.totalLabel}</p>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex h-11 items-center justify-center rounded-full bg-charcoal px-4 text-sm font-medium text-ivory shadow-soft transition hover:bg-charcoal/90"
                        >
                          Open order
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-charcoal/62">
                No linked orders yet. The inquiry conversion flow will create the first order
                history entry here.
              </p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Customer summary">
            <div className="rounded-[1.6rem] border border-charcoal/8 bg-ivory/70 p-5">
              <div className="space-y-3 text-sm leading-7 text-charcoal/68">
                <p>{detail.email ?? "No email yet"}</p>
                <p>{detail.phone ?? "No phone yet"}</p>
                <p>Lead source: {detail.leadSource ?? "Not captured yet"}</p>
                <p>Created: {formatOptionalDateTime(detail.createdAt)}</p>
                <p>Updated: {formatOptionalDateTime(detail.updatedAt)}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Linked inquiries">
            {detail.inquiries.length > 0 ? (
              <div className="space-y-3">
                {detail.inquiries.map((inquiry) => (
                  <article
                    key={inquiry.id}
                    className="rounded-[1.5rem] border border-charcoal/10 bg-white/82 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-charcoal/10 bg-charcoal/5 text-charcoal/75">
                        {inquiry.referenceCode}
                      </Badge>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/55">
                        {toTitleCase(inquiry.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-charcoal/68">
                      {inquiry.eventType} on {formatDate(inquiry.eventDate)}
                    </p>
                    <Link
                      href={`/admin/inquiries/${inquiry.id}`}
                      className="mt-3 inline-flex text-sm font-medium text-charcoal underline decoration-gold/60 underline-offset-4"
                    >
                      Open inquiry
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-charcoal/62">
                No inquiries are linked to this customer yet.
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
