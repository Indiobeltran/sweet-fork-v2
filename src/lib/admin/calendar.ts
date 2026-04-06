import "server-only";

import { getInquiryReferenceCode } from "@/lib/admin/order-workflow";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { type Enums, type Tables } from "@/types/supabase.generated";

type BlackoutDateRow = Tables<"blackout_dates">;
type CalendarEntryRow = Tables<"calendar_entries">;
type CustomerRow = Tables<"customers">;
type InquiryRow = Tables<"inquiries">;
type OrderRow = Tables<"orders">;

type CalendarItemKind = "blackout" | "entry" | "inquiry" | "order";

export type CalendarFilters = {
  month: string;
};

export type CalendarDayItem = {
  dateKey: string;
  href: string | null;
  id: string;
  kind: CalendarItemKind;
  subtitle: string;
  timeLabel: string | null;
  title: string;
  tone: "charcoal" | "emerald" | "gold" | "rose";
};

export type CalendarDay = {
  dateKey: string;
  dayOfMonth: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: CalendarDayItem[];
};

export type CalendarAgendaItem = CalendarDayItem & {
  dateLabel: string;
};

export type CalendarBlackoutWindow = {
  dateLabel: string;
  id: string;
  isActive: boolean;
  notes: string | null;
  reason: string;
  scope: Enums<"blackout_scope">;
};

export type CalendarPageData = {
  agenda: CalendarAgendaItem[];
  blackoutWindows: CalendarBlackoutWindow[];
  days: CalendarDay[];
  monthKey: string;
  monthLabel: string;
  nextMonthKey: string;
  previousMonthKey: string;
  summary: Array<{
    detail: string;
    label: string;
    value: string;
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function createUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function formatTimeLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function parseMonthKey(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map((part) => Number(part));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return createUtcDate(year, month - 1, 1);
}

function getMonthWindow(monthKey: string) {
  const monthStart = parseMonthKey(monthKey) ?? createUtcDate(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1);
  const monthEnd = createUtcDate(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0);
  const gridStart = createUtcDate(
    monthStart.getUTCFullYear(),
    monthStart.getUTCMonth(),
    monthStart.getUTCDate() - monthStart.getUTCDay(),
  );
  const gridEnd = createUtcDate(
    monthEnd.getUTCFullYear(),
    monthEnd.getUTCMonth(),
    monthEnd.getUTCDate() + (6 - monthEnd.getUTCDay()),
  );

  return {
    gridEnd,
    gridStart,
    monthEnd,
    monthStart,
  };
}

function createDateRangeKeys(startDateKey: string, endDateKey: string) {
  const keys: string[] = [];
  let cursor = new Date(`${startDateKey}T12:00:00.000Z`);
  const end = new Date(`${endDateKey}T12:00:00.000Z`);

  while (cursor <= end) {
    keys.push(getDateKey(cursor));
    cursor = createUtcDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1);
  }

  return keys;
}

function buildToneForOrder(status: Enums<"order_status">): CalendarDayItem["tone"] {
  switch (status) {
    case "confirmed":
    case "completed":
      return "emerald";
    case "quoted":
      return "gold";
    case "in-production":
      return "rose";
    default:
      return "charcoal";
  }
}

function buildToneForInquiry(status: Enums<"inquiry_status">): CalendarDayItem["tone"] {
  switch (status) {
    case "new":
      return "gold";
    case "quoted":
      return "rose";
    case "approved":
      return "emerald";
    default:
      return "charcoal";
  }
}

function getCustomerLabel(
  customerId: string | null,
  customers: Map<string, Pick<CustomerRow, "full_name" | "id">>,
  fallback: string | null,
) {
  if (customerId) {
    const customer = customers.get(customerId);

    if (customer?.full_name) {
      return customer.full_name;
    }
  }

  return fallback ?? "Sweet Fork client";
}

export function parseCalendarFilters(
  rawSearchParams: Record<string, string | string[] | undefined>,
): CalendarFilters {
  const rawMonth = getSearchValue(rawSearchParams.month);
  const parsed = parseMonthKey(rawMonth);

  return {
    month: parsed ? getMonthKey(parsed) : getMonthKey(createUtcDate(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
  };
}

export async function getCalendarPageData(filters: CalendarFilters): Promise<CalendarPageData> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin calendar.");
  }

  const { gridEnd, gridStart, monthEnd, monthStart } = getMonthWindow(filters.month);
  const monthStartKey = getDateKey(monthStart);
  const monthEndKey = getDateKey(monthEnd);
  const gridStartKey = getDateKey(gridStart);
  const gridEndKey = getDateKey(gridEnd);
  const previousMonthKey = getMonthKey(createUtcDate(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1));
  const nextMonthKey = getMonthKey(createUtcDate(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));

  const [{ data: orderData, error: orderError }, { data: inquiryData, error: inquiryError }, { data: calendarData, error: calendarError }, { data: blackoutData, error: blackoutError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, customer_id, inquiry_id, event_date, event_type, fulfillment_method, status")
        .gte("event_date", gridStartKey)
        .lte("event_date", gridEndKey)
        .order("event_date", { ascending: true }),
      supabase
        .from("inquiries")
        .select("id, customer_id, customer_name, event_date, event_type, fulfillment_method, metadata, status")
        .gte("event_date", gridStartKey)
        .lte("event_date", gridEndKey)
        .in("status", ["new", "reviewing", "quoted", "approved"])
        .order("event_date", { ascending: true }),
      supabase
        .from("calendar_entries")
        .select("id, entry_type, title, starts_at, ends_at, all_day, customer_id, inquiry_id, order_id, location_text, notes, is_private")
        .gte("starts_at", createUtcDate(gridStart.getUTCFullYear(), gridStart.getUTCMonth() - 1, 1).toISOString())
        .lte("starts_at", createUtcDate(gridEnd.getUTCFullYear(), gridEnd.getUTCMonth() + 1, gridEnd.getUTCDate()).toISOString())
        .order("starts_at", { ascending: true }),
      supabase
        .from("blackout_dates")
        .select("*")
        .lte("starts_on", gridEndKey)
        .gte("ends_on", gridStartKey)
        .order("starts_on", { ascending: true }),
    ]);

  if (orderError) {
    throw orderError;
  }

  if (inquiryError) {
    throw inquiryError;
  }

  if (calendarError) {
    throw calendarError;
  }

  if (blackoutError) {
    throw blackoutError;
  }

  const orders = (orderData ?? []) as Array<
    Pick<
      OrderRow,
      "customer_id" | "event_date" | "event_type" | "fulfillment_method" | "id" | "inquiry_id" | "status"
    >
  >;
  const inquiries = (inquiryData ?? []) as Array<
    Pick<
      InquiryRow,
      "customer_id" | "customer_name" | "event_date" | "event_type" | "fulfillment_method" | "id" | "metadata" | "status"
    >
  >;
  const calendarEntries = (calendarData ?? []) as Array<
    Pick<
      CalendarEntryRow,
      | "all_day"
      | "customer_id"
      | "ends_at"
      | "entry_type"
      | "id"
      | "inquiry_id"
      | "is_private"
      | "location_text"
      | "notes"
      | "order_id"
      | "starts_at"
      | "title"
    >
  >;
  const blackoutDates = (blackoutData ?? []) as BlackoutDateRow[];

  const customerIds = Array.from(
    new Set(
      [...orders.map((order) => order.customer_id), ...inquiries.map((inquiry) => inquiry.customer_id), ...calendarEntries.map((entry) => entry.customer_id)]
        .filter(Boolean) as string[],
    ),
  );
  const linkedInquiryIds = Array.from(
    new Set(
      [...orders.map((order) => order.inquiry_id), ...calendarEntries.map((entry) => entry.inquiry_id)]
        .filter(Boolean) as string[],
    ),
  );

  const [{ data: customerData, error: customerError }, { data: linkedInquiryData, error: linkedInquiryError }] =
    await Promise.all([
      customerIds.length > 0
        ? supabase.from("customers").select("id, full_name").in("id", customerIds)
        : Promise.resolve({ data: [], error: null }),
      linkedInquiryIds.length > 0
        ? supabase.from("inquiries").select("id, metadata").in("id", linkedInquiryIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (customerError) {
    throw customerError;
  }

  if (linkedInquiryError) {
    throw linkedInquiryError;
  }

  const customerMap = new Map(
    ((customerData ?? []) as Array<Pick<CustomerRow, "full_name" | "id">>).map((row) => [row.id, row]),
  );
  const inquiryReferenceMap = new Map(
    ((linkedInquiryData ?? []) as Array<Pick<InquiryRow, "id" | "metadata">>).map((row) => [row.id, row]),
  );

  const itemsByDate = new Map<string, CalendarDayItem[]>();
  const agendaItems: CalendarAgendaItem[] = [];

  const pushItem = (dateKey: string, item: CalendarDayItem) => {
    const existing = itemsByDate.get(dateKey) ?? [];
    existing.push(item);
    itemsByDate.set(dateKey, existing);
  };

  orders.forEach((order) => {
    const customerLabel = getCustomerLabel(order.customer_id, customerMap, null);
    const reference =
      order.inquiry_id && inquiryReferenceMap.has(order.inquiry_id)
        ? getInquiryReferenceCode(inquiryReferenceMap.get(order.inquiry_id)!)
        : `ORD-${order.id.slice(0, 8).toUpperCase()}`;
    const item: CalendarDayItem = {
      dateKey: order.event_date,
      href: `/admin/orders/${order.id}`,
      id: order.id,
      kind: "order",
      subtitle: `${order.fulfillment_method === "delivery" ? "Delivery" : "Pickup"} • ${reference}`,
      timeLabel: null,
      title: `${customerLabel} ${order.event_type}`,
      tone: buildToneForOrder(order.status),
    };

    pushItem(order.event_date, item);
    agendaItems.push({
      ...item,
      dateLabel: formatDateLabel(order.event_date),
    });
  });

  inquiries.forEach((inquiry) => {
    const item: CalendarDayItem = {
      dateKey: inquiry.event_date,
      href: `/admin/inquiries/${inquiry.id}`,
      id: inquiry.id,
      kind: "inquiry",
      subtitle: `${inquiry.fulfillment_method === "delivery" ? "Delivery" : "Pickup"} • ${getInquiryReferenceCode(inquiry)}`,
      timeLabel: null,
      title: `${inquiry.customer_name} inquiry`,
      tone: buildToneForInquiry(inquiry.status),
    };

    pushItem(inquiry.event_date, item);
    agendaItems.push({
      ...item,
      dateLabel: formatDateLabel(inquiry.event_date),
    });
  });

  calendarEntries.forEach((entry) => {
    const startDateKey = entry.starts_at.slice(0, 10);
    const endDateKey = entry.ends_at ? entry.ends_at.slice(0, 10) : startDateKey;
    const dateKeys = createDateRangeKeys(startDateKey, endDateKey);
    const item: CalendarDayItem = {
      dateKey: startDateKey,
      href: null,
      id: entry.id,
      kind: "entry",
      subtitle:
        `${entry.entry_type.replace(/-/g, " ")}${entry.location_text ? ` • ${entry.location_text}` : ""}${entry.is_private ? " • private" : ""}`,
      timeLabel: entry.all_day ? "All day" : formatTimeLabel(entry.starts_at),
      title: entry.title,
      tone: entry.entry_type === "holiday" || entry.entry_type === "blackout" ? "rose" : "charcoal",
    };

    dateKeys
      .filter((dateKey) => dateKey >= gridStartKey && dateKey <= gridEndKey)
      .forEach((dateKey) => {
        pushItem(dateKey, {
          ...item,
          dateKey,
        });
      });

    if (startDateKey >= monthStartKey && startDateKey <= monthEndKey) {
      agendaItems.push({
        ...item,
        dateLabel: formatDateLabel(startDateKey),
      });
    }
  });

  blackoutDates.forEach((blackout) => {
    const dateKeys = createDateRangeKeys(blackout.starts_on, blackout.ends_on);
    const item: CalendarDayItem = {
      dateKey: blackout.starts_on,
      href: null,
      id: blackout.id,
      kind: "blackout",
      subtitle: `${blackout.scope} availability blocked`,
      timeLabel: "Blocked",
      title: blackout.reason,
      tone: "rose",
    };

    dateKeys
      .filter((dateKey) => dateKey >= gridStartKey && dateKey <= gridEndKey)
      .forEach((dateKey) => {
        pushItem(dateKey, {
          ...item,
          dateKey,
        });
      });

    agendaItems.push({
      ...item,
      dateLabel: `${formatDateLabel(blackout.starts_on)}${blackout.ends_on !== blackout.starts_on ? ` to ${formatDateLabel(blackout.ends_on)}` : ""}`,
    });
  });

  const todayKey = getDateKey(createUtcDate(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const days = createDateRangeKeys(gridStartKey, gridEndKey).map((dateKey) => {
    const cellDate = new Date(`${dateKey}T12:00:00.000Z`);
    const items = (itemsByDate.get(dateKey) ?? []).sort((left, right) => {
      const leftPriority = ["blackout", "order", "entry", "inquiry"].indexOf(left.kind);
      const rightPriority = ["blackout", "order", "entry", "inquiry"].indexOf(right.kind);

      if (leftPriority === rightPriority) {
        return left.title.localeCompare(right.title);
      }

      return leftPriority - rightPriority;
    });

    return {
      dateKey,
      dayOfMonth: String(cellDate.getUTCDate()),
      isCurrentMonth: dateKey >= monthStartKey && dateKey <= monthEndKey,
      isToday: dateKey === todayKey,
      items,
    } satisfies CalendarDay;
  });

  const blockedDaysInMonth = blackoutDates.reduce((count, blackout) => {
    return (
      count +
      createDateRangeKeys(blackout.starts_on, blackout.ends_on).filter(
        (dateKey) => dateKey >= monthStartKey && dateKey <= monthEndKey && blackout.is_active,
      ).length
    );
  }, 0);

  const ordersInMonth = orders.filter(
    (order) => order.event_date >= monthStartKey && order.event_date <= monthEndKey,
  ).length;
  const deliveriesInMonth = orders.filter(
    (order) =>
      order.event_date >= monthStartKey &&
      order.event_date <= monthEndKey &&
      order.fulfillment_method === "delivery",
  ).length;
  const inquiriesInMonth = inquiries.filter(
    (inquiry) => inquiry.event_date >= monthStartKey && inquiry.event_date <= monthEndKey,
  ).length;
  const manualEntriesInMonth = calendarEntries.filter((entry) => {
    const startDateKey = entry.starts_at.slice(0, 10);
    return startDateKey >= monthStartKey && startDateKey <= monthEndKey;
  }).length;

  return {
    agenda: agendaItems
      .sort((left, right) => {
        if (left.dateKey === right.dateKey) {
          return left.title.localeCompare(right.title);
        }

        return left.dateKey.localeCompare(right.dateKey);
      })
      .slice(0, 20),
    blackoutWindows: blackoutDates.map((blackout) => ({
      dateLabel:
        blackout.starts_on === blackout.ends_on
          ? formatDateLabel(blackout.starts_on)
          : `${formatDateLabel(blackout.starts_on)} to ${formatDateLabel(blackout.ends_on)}`,
      id: blackout.id,
      isActive: blackout.is_active,
      notes: blackout.notes,
      reason: blackout.reason,
      scope: blackout.scope,
    })),
    days,
    monthKey: filters.month,
    monthLabel: formatMonthLabel(monthStart),
    nextMonthKey,
    previousMonthKey,
    summary: [
      {
        label: "Orders",
        value: String(ordersInMonth),
        detail: `${deliveriesInMonth} delivery date${deliveriesInMonth === 1 ? "" : "s"} scheduled this month.`,
      },
      {
        label: "Active inquiries",
        value: String(inquiriesInMonth),
        detail: "Inquiry event dates still worth watching before they convert into confirmed work.",
      },
      {
        label: "Blocked days",
        value: String(blockedDaysInMonth),
        detail:
          blockedDaysInMonth === 0
            ? "No active blackout dates overlap this month."
            : "Days marked unavailable because of travel, sold-out weekends, or personal blocks.",
      },
      {
        label: "Manual calendar notes",
        value: String(manualEntriesInMonth),
        detail: "All-day reminders, tastings, and operational notes stored in `calendar_entries`.",
      },
    ],
  };
}
