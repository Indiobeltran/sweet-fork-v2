export type OrderListViewEntry = {
  balanceDue: number;
  balanceDueLabel: string;
  customerLabel: string;
  eventDate: string;
  eventType: string;
  id: string;
  referenceCode: string;
  status: string;
  totalAmount: number;
  totalLabel: string;
};

export type OrderListQueue =
  | "active"
  | "all"
  | "awaiting-payment"
  | "cancelled"
  | "completed"
  | "upcoming";

export type OrderDueDateSectionKey = "overdue" | "this-week" | "next-week" | "later";

export type OrderDueDateSection<TEntry extends OrderListViewEntry> = {
  entries: TEntry[];
  key: OrderDueDateSectionKey;
  label: string;
};

export type CombinedPaymentPill = {
  label: string;
  tone: "attention" | "paid";
};

const dayInMs = 24 * 60 * 60 * 1000;

const dueDateSectionLabels: Record<OrderDueDateSectionKey, string> = {
  overdue: "Overdue",
  "this-week": "This week",
  "next-week": "Next week",
  later: "Later",
};

function parseDateOnly(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function getDayDifference(eventDate: string, today: string) {
  const eventTime = parseDateOnly(eventDate).getTime();
  const todayTime = parseDateOnly(today).getTime();

  return Math.round((eventTime - todayTime) / dayInMs);
}

function isFinishedOrder(entry: Pick<OrderListViewEntry, "status">) {
  return entry.status === "completed" || entry.status === "fulfilled" || entry.status === "cancelled";
}

function isKnownActiveStatus(status: string) {
  return (
    status === "draft" ||
    status === "quoted" ||
    status === "confirmed" ||
    status === "in-production"
  );
}

function getDueDateSectionKey(entry: OrderListViewEntry, today: string): OrderDueDateSectionKey {
  const dayDifference = getDayDifference(entry.eventDate, today);

  if (dayDifference < 0) {
    return "overdue";
  }

  if (dayDifference <= 6) {
    return "this-week";
  }

  if (dayDifference <= 13) {
    return "next-week";
  }

  return "later";
}

export function getOrderRelativeDateLabel(eventDate: string, today: string) {
  const dayDifference = getDayDifference(eventDate, today);

  if (dayDifference === 0) {
    return "today";
  }

  if (dayDifference === 1) {
    return "tomorrow";
  }

  if (dayDifference === -1) {
    return "yesterday";
  }

  if (dayDifference < 0) {
    return `${Math.abs(dayDifference)} days overdue`;
  }

  return `in ${dayDifference} days`;
}

export function groupOrdersByDueDate<TEntry extends OrderListViewEntry>(
  entries: TEntry[],
  today: string,
): Array<OrderDueDateSection<TEntry>> {
  const grouped = new Map<OrderDueDateSectionKey, TEntry[]>();

  entries.forEach((entry) => {
    if (isFinishedOrder(entry)) {
      return;
    }

    const key = getDueDateSectionKey(entry, today);
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  });

  return (["overdue", "this-week", "next-week", "later"] as const)
    .map((key) => ({
      entries: (grouped.get(key) ?? []).toSorted((left, right) => {
        const dateComparison = left.eventDate.localeCompare(right.eventDate);
        return dateComparison === 0
          ? left.customerLabel.localeCompare(right.customerLabel)
          : dateComparison;
      }),
      key,
      label: dueDateSectionLabels[key],
    }))
    .filter((section) => section.entries.length > 0);
}

export function isActiveOrder(entry: Pick<OrderListViewEntry, "status">) {
  return isKnownActiveStatus(entry.status);
}

export function isAwaitingPaymentOrder(
  entry: Pick<OrderListViewEntry, "balanceDue" | "status"> & { paymentState?: string },
) {
  return (
    isActiveOrder(entry) &&
    entry.balanceDue > 0 &&
    entry.paymentState !== "paid" &&
    entry.paymentState !== "refunded"
  );
}

export function isUpcomingOrder(entry: Pick<OrderListViewEntry, "eventDate" | "status">, today: string) {
  return isActiveOrder(entry) && entry.eventDate >= today;
}

export function isCompletedOrder(entry: Pick<OrderListViewEntry, "status">) {
  return entry.status === "completed" || entry.status === "fulfilled";
}

export function isCancelledOrder(entry: Pick<OrderListViewEntry, "status">) {
  return entry.status === "cancelled";
}

export function filterOrdersByQueue<TEntry extends OrderListViewEntry>(
  entries: TEntry[],
  queue: OrderListQueue,
  today: string,
) {
  switch (queue) {
    case "all":
      return entries;
    case "awaiting-payment":
      return entries.filter(isAwaitingPaymentOrder);
    case "cancelled":
      return entries.filter(isCancelledOrder);
    case "upcoming":
      return entries.filter((entry) => isUpcomingOrder(entry, today));
    case "completed":
      return entries.filter(isCompletedOrder);
    default:
      return entries.filter(isActiveOrder);
  }
}

export function buildOrderQueueCounts<TEntry extends OrderListViewEntry>(
  entries: TEntry[],
  today: string,
): Record<OrderListQueue, number> {
  return {
    active: entries.filter(isActiveOrder).length,
    all: entries.length,
    "awaiting-payment": entries.filter(isAwaitingPaymentOrder).length,
    cancelled: entries.filter(isCancelledOrder).length,
    completed: entries.filter(isCompletedOrder).length,
    upcoming: entries.filter((entry) => isUpcomingOrder(entry, today)).length,
  };
}

export function filterOrdersBySearch<TEntry extends OrderListViewEntry>(
  entries: TEntry[],
  search: string,
) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return entries;
  }

  return entries.filter((entry) =>
    [entry.customerLabel, entry.eventType, entry.referenceCode]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );
}

export function buildCombinedPaymentPill({
  balanceDue,
  balanceDueLabel,
  totalAmount,
  totalLabel,
}: Pick<OrderListViewEntry, "balanceDue" | "balanceDueLabel" | "totalAmount" | "totalLabel">): CombinedPaymentPill {
  if (balanceDue > 0) {
    return {
      label: `${balanceDueLabel} due of ${totalLabel}`,
      tone: "attention",
    };
  }

  return {
    label: `${totalAmount > 0 ? totalLabel : "$0"} paid`,
    tone: "paid",
  };
}
