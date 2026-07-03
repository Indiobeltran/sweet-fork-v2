import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { buildDashboardFinanceSummary, buildReportsSummary, getDashboardFinanceVisibility } from "./finance.ts";

describe("dashboard finance summary", () => {
  it("sums confirmed upcoming orders and active inquiry estimates", () => {
    const summary = buildDashboardFinanceSummary({
      inquiries: [
        { estimatedMax: 500, estimatedMin: 300, status: "new" },
        { estimatedMax: null, estimatedMin: 250, status: "reviewing" },
        { estimatedMax: 900, estimatedMin: 700, status: "archived" },
      ],
      orders: [
        { eventDate: "2026-07-08", status: "confirmed", totalAmount: 1200 },
        { eventDate: "2026-07-09", status: "confirmed", totalAmount: 800 },
        { eventDate: "2026-07-10", status: "quoted", totalAmount: 300 },
        { eventDate: "2026-06-30", status: "confirmed", totalAmount: 500 },
      ],
      today: "2026-07-03",
    });

    assert.equal(summary.bookedAheadLabel, "$2,000 · 2 orders");
    assert.equal(summary.bookedAheadValue, 2000);
    assert.equal(summary.pendingValueLabel, "$750");
    assert.equal(summary.pendingValue, 750);
  });

  it("keeps zero-value labels visible", () => {
    const summary = buildDashboardFinanceSummary({
      inquiries: [],
      orders: [],
      today: "2026-07-03",
    });

    assert.equal(summary.bookedAheadLabel, "$0 · 0 orders");
    assert.equal(summary.pendingValueLabel, "$0");
  });
});

describe("dashboard finance visibility", () => {
  it("defaults on unless the stored setting is explicitly false", () => {
    assert.equal(getDashboardFinanceVisibility(null), true);
    assert.equal(getDashboardFinanceVisibility({ showFinance: true }), true);
    assert.equal(getDashboardFinanceVisibility({ showFinance: false }), false);
  });
});

describe("reports summary", () => {
  it("groups revenue and counts by event month while excluding cancelled orders", () => {
    const reports = buildReportsSummary({
      now: "2026-07-03T12:00:00.000Z",
      orders: [
        { eventDate: "2026-07-02", status: "confirmed", totalAmount: 400 },
        { eventDate: "2026-07-10", status: "completed", totalAmount: 600 },
        { eventDate: "2025-07-20", status: "fulfilled", totalAmount: 250 },
        { eventDate: "2026-06-15", status: "confirmed", totalAmount: 300 },
        { eventDate: "2026-07-11", status: "cancelled", totalAmount: 900 },
      ],
    });

    assert.equal(reports.currentMonthRevenue, 1000);
    assert.equal(reports.sameMonthLastYearRevenue, 250);
    assert.equal(reports.trailingTwelveMonthRevenue, 1300);
    assert.equal(reports.averageOrderValue, 388);
    assert.equal(reports.totalOrderCount, 4);
    assert.deepEqual(
      reports.monthlyOrderCounts
        .filter((month) => month.orderCount > 0)
        .map((month) => [month.monthKey, month.orderCount, month.revenue]),
      [
        ["2026-06", 1, 300],
        ["2026-07", 2, 1000],
      ],
    );
  });
});
