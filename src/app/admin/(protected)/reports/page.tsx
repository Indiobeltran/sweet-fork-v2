import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { getReportsAdminData } from "@/lib/admin/finance-data";

export const metadata = {
  title: "Admin Reports",
};

export default async function AdminReportsPage() {
  const data = await getReportsAdminData();
  const maxMonthlyRevenue = Math.max(
    ...data.monthlyOrderCounts.map((month) => month.revenue),
    1,
  );

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      <AdminPageHeader
        hideTitleOnMobile
        title="Reports"
        description="A lightweight read on booked order value using the order totals already saved in the admin workspace."
        meta={
          <span>
            <span className="font-semibold text-charcoal">{data.totalOrderCount}</span>{" "}
            counted orders
          </span>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.35rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">
            This month
          </p>
          <p className="mt-2 font-serif text-[1.8rem] tracking-[-0.04em] text-charcoal">
            {data.currentMonthRevenueLabel}
          </p>
        </article>
        <article className="rounded-[1.35rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">
            Same month last year
          </p>
          <p className="mt-2 font-serif text-[1.8rem] tracking-[-0.04em] text-charcoal">
            {data.sameMonthLastYearRevenueLabel}
          </p>
        </article>
        <article className="rounded-[1.35rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">
            Trailing 12 months
          </p>
          <p className="mt-2 font-serif text-[1.8rem] tracking-[-0.04em] text-charcoal">
            {data.trailingTwelveMonthRevenueLabel}
          </p>
        </article>
        <article className="rounded-[1.35rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">
            Average order value
          </p>
          <p className="mt-2 font-serif text-[1.8rem] tracking-[-0.04em] text-charcoal">
            {data.averageOrderValueLabel}
          </p>
        </article>
      </section>

      <AdminSectionCard
        title="Bookkeeping export"
        description="Download order totals, payment and refund activity, and Square references for Relay or your accountant."
      >
        <form action="/api/admin/reports/financial-export" className="flex flex-wrap items-end gap-3" method="get">
          <label className="grid gap-1 text-sm text-charcoal/70">
            Event month (optional)
            <input className="rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-charcoal" name="month" type="month" />
          </label>
          <button className="rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-white" type="submit">
            Download CSV
          </button>
        </form>
        <p className="mt-3 text-sm text-charcoal/55">The export is a reconciliation aid; Square remains authoritative for card-processing fees and Relay remains authoritative for bank transactions.</p>
      </AdminSectionCard>

      <AdminSectionCard
        title="Order count by month"
        description="Each row shows counted order totals and booked value for the trailing twelve months."
      >
        <div className="space-y-3">
          {data.monthlyOrderCounts.map((month) => (
            <div
              key={month.monthKey}
              className="rounded-[1.15rem] border border-charcoal/8 bg-paper/80 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-charcoal">{month.monthLabel}</span>
                <span className="text-charcoal/64">
                  {month.orderCount} order{month.orderCount === 1 ? "" : "s"} · {month.revenueLabel}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-charcoal/8">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${Math.max((month.revenue / maxMonthlyRevenue) * 100, month.revenue > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
