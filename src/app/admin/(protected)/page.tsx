import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Clock, FileText, ImageIcon, Layers, MessageCircle } from "lucide-react";

import { getInquiryListData } from "@/lib/admin/inquiries";
import { getOrderListData } from "@/lib/admin/orders";
import { getMediaLibraryData } from "@/lib/admin/site-management";
import { formatDate, toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const [inquiriesData, ordersData, mediaData] = await Promise.all([
    getInquiryListData({
      budgetRange: "all",
      eventDateFrom: "",
      eventDateTo: "",
      fulfillmentMethod: "all",
      priority: "all",
      productType: "all",
      search: "",
      status: "active",
      urgency: "all",
    }),
    getOrderListData({
      eventDateFrom: "",
      eventDateTo: "",
      fulfillmentMethod: "all",
      paymentState: "all",
      search: "",
      status: "all",
    }),
    getMediaLibraryData(),
  ]);

  const newInquiriesCount = inquiriesData.statusCounts.new;
  const reviewingInquiriesCount = inquiriesData.statusCounts.reviewing;
  const quotedInquiriesCount = inquiriesData.statusCounts.quoted;

  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const upcomingOrders = ordersData.entries
    .filter(
      (entry) =>
        entry.eventDate >= today &&
        entry.status !== "cancelled" &&
        entry.status !== "completed" &&
        entry.status !== "fulfilled"
    )
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const dueSoonOrdersCount = upcomingOrders.filter((entry) => entry.eventDate <= nextWeek).length;
  const paymentAttentionCount = upcomingOrders.filter((entry) => entry.paymentState !== "paid").length;

  const mediaWarningsCount = mediaData.placementWarnings.length;

  const hasNeedsAttention =
    newInquiriesCount > 0 ||
    reviewingInquiriesCount > 0 ||
    quotedInquiriesCount > 0 ||
    dueSoonOrdersCount > 0 ||
    paymentAttentionCount > 0 ||
    mediaWarningsCount > 0;

  const newInquiries = inquiriesData.entries.filter((entry) => entry.status === "new");
  const reviewingInquiries = inquiriesData.entries.filter(
    (entry) => entry.status === "reviewing" || entry.status === "quoted"
  );
  const needsAttentionInquiries = [...newInquiries, ...reviewingInquiries].slice(0, 4);
  const immediateOrders = upcomingOrders.slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6">
      <header className="rounded-[1.65rem] border border-charcoal/10 bg-white/88 p-5 sm:p-6 shadow-soft">
        <h1 className="font-serif text-3xl tracking-[-0.03em] text-charcoal">Today at The Sweet Fork</h1>
        <p className="mt-2 text-charcoal/70 text-[0.95rem] sm:text-base leading-relaxed">
          Here&apos;s a quick look at what needs your attention right now.
        </p>
      </header>

      {hasNeedsAttention ? (
        <section aria-labelledby="needs-attention-heading" className="space-y-3 sm:space-y-4">
          <h2 id="needs-attention-heading" className="sr-only">Needs Attention</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {newInquiriesCount > 0 && (
              <Link href="/admin/inquiries" className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gold/20">
                <MessageCircle className="h-4 w-4 text-gold" />
                {newInquiriesCount} New {newInquiriesCount === 1 ? "inquiry" : "inquiries"}
              </Link>
            )}
            {reviewingInquiriesCount > 0 && (
              <Link href="/admin/inquiries" className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 bg-white/80 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-charcoal/40">
                <FileText className="h-4 w-4 text-charcoal/60" />
                {reviewingInquiriesCount} Details needed
              </Link>
            )}
            {quotedInquiriesCount > 0 && (
              <Link href="/admin/inquiries" className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 bg-white/80 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-charcoal/40">
                <Clock className="h-4 w-4 text-charcoal/60" />
                {quotedInquiriesCount} Quote follow-up
              </Link>
            )}
            {dueSoonOrdersCount > 0 && (
              <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-rose-500/20">
                <CalendarDays className="h-4 w-4 text-rose-600" />
                {dueSoonOrdersCount} Due within 7 days
              </Link>
            )}
            {paymentAttentionCount > 0 && (
              <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 bg-white/80 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-charcoal/40">
                <AlertCircle className="h-4 w-4 text-charcoal/60" />
                {paymentAttentionCount} Payment attention
              </Link>
            )}
            {mediaWarningsCount > 0 && (
              <Link href="/admin/media" className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 bg-white/80 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-charcoal/40">
                <ImageIcon className="h-4 w-4 text-charcoal/60" />
                {mediaWarningsCount} Media needs review
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section aria-labelledby="needs-attention-heading">
          <h2 id="needs-attention-heading" className="sr-only">Needs Attention</h2>
          <div className="inline-flex items-center gap-2 rounded-full border border-green-600/20 bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            All clear—nothing urgent right now.
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
        <section aria-labelledby="attention-inquiries-heading" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 id="attention-inquiries-heading" className="font-serif text-2xl tracking-[-0.02em] text-charcoal">
              Active Inquiries
            </h2>
            <Link href="/admin/inquiries" className="text-sm font-medium text-charcoal/60 hover:text-charcoal transition-colors">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {needsAttentionInquiries.length > 0 ? (
              needsAttentionInquiries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/admin/inquiries/${entry.id}`}
                  className="group flex flex-col justify-between rounded-[1.35rem] border border-charcoal/10 bg-white/80 p-4 transition-all hover:border-charcoal/25 sm:flex-row sm:items-center gap-3 shadow-[0_2px_8px_rgba(53,37,29,0.02)]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-charcoal">{entry.customerName}</span>
                      <span className={`rounded-full border border-charcoal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${entry.status === 'new' ? 'bg-gold/12 text-charcoal' : 'bg-charcoal/5 text-charcoal/70'}`}>
                        {toTitleCase(entry.status)}
                      </span>
                    </div>
                    <p className="text-[13px] text-charcoal/60 mt-1">
                      {entry.eventType} on {formatDate(entry.eventDate)}
                    </p>
                  </div>
                  <div className="text-charcoal/30 transition-colors group-hover:text-charcoal/70 hidden sm:block">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-charcoal/15 bg-ivory/40 p-6 text-center">
                <p className="text-charcoal/80 text-sm">Your inquiry desk is clear right now!</p>
                <Link href="/admin/inquiries" className="mt-2 inline-block text-sm font-medium text-gold hover:text-gold/80 hover:underline">
                  Check all inquiries
                </Link>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="upcoming-orders-heading" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 id="upcoming-orders-heading" className="font-serif text-2xl tracking-[-0.02em] text-charcoal">
              Upcoming Orders
            </h2>
            <Link href="/admin/orders" className="text-sm font-medium text-charcoal/60 hover:text-charcoal transition-colors">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {immediateOrders.length > 0 ? (
              immediateOrders.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/admin/orders/${entry.id}`}
                  className="group flex flex-col justify-between rounded-[1.35rem] border border-charcoal/10 bg-white/80 p-4 transition-all hover:border-charcoal/25 sm:flex-row sm:items-center gap-3 shadow-[0_2px_8px_rgba(53,37,29,0.02)]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-charcoal">{entry.customerLabel}</span>
                    </div>
                    <p className="text-[13px] text-charcoal/60 mt-1">
                      {formatDate(entry.eventDate)} • {entry.totalLabel}
                    </p>
                  </div>
                  <div className="text-charcoal/30 transition-colors group-hover:text-charcoal/70 hidden sm:block">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-charcoal/15 bg-ivory/40 p-6 text-center">
                <p className="text-charcoal/80 text-sm">No confirmed upcoming events.</p>
                <Link href="/admin/orders" className="mt-2 inline-block text-sm font-medium text-gold hover:text-gold/80 hover:underline">
                  View order history
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="quick-actions-heading" className="space-y-4">
        <h2 id="quick-actions-heading" className="font-serif text-2xl tracking-[-0.02em] text-charcoal px-1">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/inquiries"
            className="flex items-center gap-3 rounded-[1.5rem] border border-charcoal/10 bg-white/90 p-4 transition-all hover:border-charcoal/30 hover:bg-white shadow-[0_2px_8px_rgba(53,37,29,0.02)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal/5 text-charcoal/80">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-medium text-[0.95rem] text-charcoal">Manage inquiries</span>
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center gap-3 rounded-[1.5rem] border border-charcoal/10 bg-white/90 p-4 transition-all hover:border-charcoal/30 hover:bg-white shadow-[0_2px_8px_rgba(53,37,29,0.02)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal/5 text-charcoal/80">
              <CalendarDays className="h-5 w-5" />
            </div>
            <span className="font-medium text-[0.95rem] text-charcoal">Upcoming orders</span>
          </Link>

          <Link
            href="/admin/content"
            className="flex items-center gap-3 rounded-[1.5rem] border border-charcoal/10 bg-white/90 p-4 transition-all hover:border-charcoal/30 hover:bg-white shadow-[0_2px_8px_rgba(53,37,29,0.02)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal/5 text-charcoal/80">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="font-medium text-[0.95rem] text-charcoal">Gallery & content</span>
          </Link>

          <Link
            href="/admin/pricing"
            className="flex items-center gap-3 rounded-[1.5rem] border border-charcoal/10 bg-white/90 p-4 transition-all hover:border-charcoal/30 hover:bg-white shadow-[0_2px_8px_rgba(53,37,29,0.02)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal/5 text-charcoal/80">
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-medium text-[0.95rem] text-charcoal">Update pricing</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
