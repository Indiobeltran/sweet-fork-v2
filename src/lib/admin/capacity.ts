export type CapacityLoadState = "full" | "light" | "moderate" | "none" | "overbooked";

export type CapacityProduct = {
  capacityPoints: number | null;
  id: string;
  productType: string;
};

export type CapacityOrderItem = {
  capacityPointsOverride: number | null;
  productId: string | null;
  productType: string;
  quantity: number | null;
};

export type CapacityOrder = {
  eventDate: string;
  id: string;
  items: CapacityOrderItem[];
  status: string;
};

export type CapacityInquiry = {
  eventDate: string;
  id: string;
  status: string;
};

export type CapacityDayLoad = {
  dateKey: string;
  inquiryCount: number;
  loadState: CapacityLoadState;
  orderCount: number;
  orderPoints: number;
  weekStartKey: string;
};

export type CapacityWeekLoad = {
  inquiryCount: number;
  loadState: CapacityLoadState;
  orderCount: number;
  orderPoints: number;
  weekEndKey: string;
  weekStartKey: string;
};

export type CapacityLoadResult = {
  days: CapacityDayLoad[];
  weeks: CapacityWeekLoad[];
};

export type BuildCapacityLoadInput = {
  endDateKey: string;
  inquiries: CapacityInquiry[];
  orders: CapacityOrder[];
  products: CapacityProduct[];
  startDateKey: string;
  weeklyCapacityCeiling: number;
  weekStartDay?: number;
};

const defaultProductCapacityPoints = 2;
const defaultWeeklyCapacityCeiling = 12;
const activeInquiryStatuses = new Set(["approved", "new", "quoted", "reviewing"]);

function createUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
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

function normalizePositiveInteger(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

export function getOrderLoadDateKeys(order: Pick<CapacityOrder, "eventDate" | "id" | "items" | "status">) {
  return [order.eventDate];
}

export function getWeekStartKey(dateKey: string, weekStartDay = 0) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  const normalizedWeekStartDay = Math.min(Math.max(Math.trunc(weekStartDay), 0), 6);
  const offset = (date.getUTCDay() - normalizedWeekStartDay + 7) % 7;

  return getDateKey(createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - offset));
}

export function getCapacityLoadState(
  dayPoints: number,
  weekPoints: number,
  weeklyCapacityCeiling: number,
): CapacityLoadState {
  const ceiling = normalizePositiveInteger(weeklyCapacityCeiling, defaultWeeklyCapacityCeiling);

  if (dayPoints <= 0) {
    return weekPoints > ceiling ? "overbooked" : "none";
  }

  if (dayPoints > ceiling || weekPoints > ceiling) {
    return "overbooked";
  }

  if (dayPoints > ceiling * 0.5 || weekPoints >= ceiling) {
    return "full";
  }

  if (dayPoints > ceiling * 0.25) {
    return "moderate";
  }

  return "light";
}

function buildProductPointLookup(products: CapacityProduct[]) {
  const byProductId = new Map<string, number>();
  const byProductType = new Map<string, number>();

  products.forEach((product) => {
    const points = normalizePositiveInteger(product.capacityPoints, defaultProductCapacityPoints);
    byProductId.set(product.id, points);
    byProductType.set(product.productType, points);
  });

  return { byProductId, byProductType };
}

function getOrderItemPoints(
  item: CapacityOrderItem,
  productPoints: ReturnType<typeof buildProductPointLookup>,
) {
  const basePoints =
    normalizePositiveInteger(item.capacityPointsOverride, 0) ||
    (item.productId ? productPoints.byProductId.get(item.productId) : undefined) ||
    productPoints.byProductType.get(item.productType) ||
    defaultProductCapacityPoints;
  const quantity = normalizePositiveInteger(item.quantity, 1);

  return basePoints * quantity;
}

function getOrderPoints(order: CapacityOrder, productPoints: ReturnType<typeof buildProductPointLookup>) {
  if (order.status !== "confirmed") {
    return 0;
  }

  if (order.items.length === 0) {
    return defaultProductCapacityPoints;
  }

  return order.items.reduce((total, item) => total + getOrderItemPoints(item, productPoints), 0);
}

function createWeekEndKey(weekStartKey: string) {
  const start = new Date(`${weekStartKey}T12:00:00.000Z`);

  return getDateKey(createUtcDate(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
}

export function buildCapacityLoad({
  endDateKey,
  inquiries,
  orders,
  products,
  startDateKey,
  weeklyCapacityCeiling,
  weekStartDay = 0,
}: BuildCapacityLoadInput): CapacityLoadResult {
  const dateKeys = createDateRangeKeys(startDateKey, endDateKey);
  const productPoints = buildProductPointLookup(products);
  const dayLoads = new Map(
    dateKeys.map((dateKey) => [
      dateKey,
      {
        dateKey,
        inquiryCount: 0,
        orderCount: 0,
        orderPoints: 0,
        weekStartKey: getWeekStartKey(dateKey, weekStartDay),
      },
    ]),
  );

  orders.forEach((order) => {
    const orderPoints = getOrderPoints(order, productPoints);

    if (orderPoints <= 0) {
      return;
    }

    getOrderLoadDateKeys(order).forEach((dateKey) => {
      const day = dayLoads.get(dateKey);

      if (!day) {
        return;
      }

      day.orderCount += 1;
      day.orderPoints += orderPoints;
    });
  });

  inquiries.forEach((inquiry) => {
    if (!activeInquiryStatuses.has(inquiry.status)) {
      return;
    }

    const day = dayLoads.get(inquiry.eventDate);

    if (day) {
      day.inquiryCount += 1;
    }
  });

  const weekTotals = new Map<string, Omit<CapacityWeekLoad, "loadState">>();

  Array.from(dayLoads.values()).forEach((day) => {
    const week = weekTotals.get(day.weekStartKey) ?? {
      inquiryCount: 0,
      orderCount: 0,
      orderPoints: 0,
      weekEndKey: createWeekEndKey(day.weekStartKey),
      weekStartKey: day.weekStartKey,
    };

    week.inquiryCount += day.inquiryCount;
    week.orderCount += day.orderCount;
    week.orderPoints += day.orderPoints;
    weekTotals.set(day.weekStartKey, week);
  });

  const weeks = Array.from(weekTotals.values())
    .sort((left, right) => left.weekStartKey.localeCompare(right.weekStartKey))
    .map((week) => ({
      ...week,
      loadState: getCapacityLoadState(week.orderPoints, week.orderPoints, weeklyCapacityCeiling),
    }));
  const weekPointsByStart = new Map(weeks.map((week) => [week.weekStartKey, week.orderPoints]));
  const days = Array.from(dayLoads.values()).map((day) => {
    const weekPoints = weekPointsByStart.get(day.weekStartKey) ?? 0;

    return {
      ...day,
      loadState: getCapacityLoadState(day.orderPoints, weekPoints, weeklyCapacityCeiling),
    };
  });

  return { days, weeks };
}
