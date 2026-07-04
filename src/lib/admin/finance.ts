import type { Enums, Json } from "@/types/supabase.generated";
import { formatBusinessDate } from "@/lib/business-time";

export type DashboardFinanceOrder = {
  eventDate: string;
  status: Enums<"order_status">;
  totalAmount: number;
};

export type DashboardFinanceInquiry = {
  estimatedMax: number | null;
  estimatedMin: number | null;
  status: Enums<"inquiry_status">;
};

export type DashboardFinanceSummary = {
  bookedAheadLabel: string;
  bookedAheadOrderCount: number;
  bookedAheadValue: number;
  pendingValue: number;
  pendingValueLabel: string;
};

export type ReportsOrder = {
  eventDate: string;
  status: Enums<"order_status">;
  totalAmount: number;
};

export type ReportsMonthSummary = {
  monthKey: string;
  monthLabel: string;
  orderCount: number;
  revenue: number;
  revenueLabel: string;
};

export type ReportsSummary = {
  averageOrderValue: number;
  averageOrderValueLabel: string;
  currentMonthRevenue: number;
  currentMonthRevenueLabel: string;
  monthlyOrderCounts: ReportsMonthSummary[];
  sameMonthLastYearRevenue: number;
  sameMonthLastYearRevenueLabel: string;
  totalOrderCount: number;
  trailingTwelveMonthRevenue: number;
  trailingTwelveMonthRevenueLabel: string;
};

const activeInquiryStatuses: Array<Enums<"inquiry_status">> = [
  "new",
  "reviewing",
  "quoted",
  "approved",
];

const revenueOrderStatuses: Array<Enums<"order_status">> = [
  "confirmed",
  "in-production",
  "fulfilled",
  "completed",
];

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function getDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMonthKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00.000Z`) : value;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function addMonths(value: Date, months: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1, 12));
}

function formatOrderCount(count: number) {
  return `${count} order${count === 1 ? "" : "s"}`;
}

function getInquiryEstimateValue(inquiry: DashboardFinanceInquiry) {
  return inquiry.estimatedMax ?? inquiry.estimatedMin ?? 0;
}

export function buildDashboardFinanceSummary({
  inquiries,
  orders,
  today,
}: {
  inquiries: DashboardFinanceInquiry[];
  orders: DashboardFinanceOrder[];
  today: string;
}): DashboardFinanceSummary {
  const bookedAheadOrders = orders.filter(
    (order) => order.status === "confirmed" && order.eventDate >= today,
  );
  const bookedAheadValue = bookedAheadOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );
  const pendingValue = inquiries
    .filter((inquiry) => activeInquiryStatuses.includes(inquiry.status))
    .reduce((sum, inquiry) => sum + getInquiryEstimateValue(inquiry), 0);

  return {
    bookedAheadLabel: `${formatCurrency(bookedAheadValue)} · ${formatOrderCount(bookedAheadOrders.length)}`,
    bookedAheadOrderCount: bookedAheadOrders.length,
    bookedAheadValue,
    pendingValue,
    pendingValueLabel: formatCurrency(pendingValue),
  };
}

export function getDashboardFinanceVisibility(value: Json | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return true;
  }

  return typeof value.showFinance === "boolean" ? value.showFinance : true;
}

export function buildDashboardGreetingSummary({
  inquiryCount,
  orderCount,
}: {
  inquiryCount: number;
  orderCount: number;
}) {
  if (orderCount === 0 && inquiryCount === 0) {
    return "Nothing on the books this week";
  }

  const parts: string[] = [];

  if (orderCount > 0) {
    parts.push(`${orderCount} order${orderCount === 1 ? "" : "s"} this week`);
  }

  if (inquiryCount > 0) {
    parts.push(`${inquiryCount} inquir${inquiryCount === 1 ? "y" : "ies"} waiting`);
  }

  return parts.join(" · ");
}

export function buildReportsSummary({
  now,
  orders,
}: {
  now: string;
  orders: ReportsOrder[];
}): ReportsSummary {
  const nowDate = new Date(now);
  const currentMonthKey = getMonthKey(nowDate);
  const sameMonthLastYearKey = getMonthKey(
    new Date(Date.UTC(nowDate.getUTCFullYear() - 1, nowDate.getUTCMonth(), 1, 12)),
  );
  const trailingStartKey = getMonthKey(addMonths(nowDate, -11));
  const trailingMonthKeys = Array.from({ length: 12 }, (_, index) =>
    getMonthKey(addMonths(nowDate, index - 11)),
  );
  const revenueOrders = orders.filter((order) => revenueOrderStatuses.includes(order.status));
  const trailingOrders = revenueOrders.filter((order) => {
    const monthKey = getMonthKey(order.eventDate);
    return monthKey >= trailingStartKey && monthKey <= currentMonthKey;
  });
  const currentMonthRevenue = revenueOrders
    .filter((order) => getMonthKey(order.eventDate) === currentMonthKey)
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const sameMonthLastYearRevenue = revenueOrders
    .filter((order) => getMonthKey(order.eventDate) === sameMonthLastYearKey)
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const trailingTwelveMonthRevenue = trailingOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );
  const totalOrderCount = revenueOrders.length;
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue =
    totalOrderCount > 0 ? Math.round(totalRevenue / totalOrderCount) : 0;

  return {
    averageOrderValue,
    averageOrderValueLabel: formatCurrency(averageOrderValue),
    currentMonthRevenue,
    currentMonthRevenueLabel: formatCurrency(currentMonthRevenue),
    monthlyOrderCounts: trailingMonthKeys.map((monthKey) => {
      const monthOrders = revenueOrders.filter((order) => getMonthKey(order.eventDate) === monthKey);
      const revenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const date = new Date(`${monthKey}-01T12:00:00.000Z`);

      return {
        monthKey,
        monthLabel: monthFormatter.format(date),
        orderCount: monthOrders.length,
        revenue,
        revenueLabel: formatCurrency(revenue),
      };
    }),
    sameMonthLastYearRevenue,
    sameMonthLastYearRevenueLabel: formatCurrency(sameMonthLastYearRevenue),
    totalOrderCount,
    trailingTwelveMonthRevenue,
    trailingTwelveMonthRevenueLabel: formatCurrency(trailingTwelveMonthRevenue),
  };
}

export function getCurrentDateLabel(now: Date) {
  return formatBusinessDate(now, {
    dateStyle: "full",
  });
}

export function getWeekRange(today: Date) {
  const start = getDateKey(today);
  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + 7);

  return {
    end: getDateKey(endDate),
    start,
  };
}
