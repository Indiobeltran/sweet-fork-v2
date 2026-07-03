export type CapacityLoadState = "full" | "light" | "moderate" | "none" | "overbooked";

export type CapacityProduct = {
  capacityPoints: number | null;
  id: string;
  productType: string;
  prepDays: number | null;
  minLeadTimeDays: number | null;
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
  duePoints: number;
  prepPoints: number;
  contributingOrders: Array<{ id: string; type: "due" | "prep"; points: number; reference?: string }>;
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

export function buildProductPointLookup(products: CapacityProduct[]) {
  const byProductId = new Map<string, { points: number; prepDays: number; minLeadTimeDays: number }>();
  const byProductType = new Map<string, { points: number; prepDays: number; minLeadTimeDays: number }>();

  products.forEach((product) => {
    const points = normalizePositiveInteger(product.capacityPoints, defaultProductCapacityPoints);
    const prepDays = Math.max(0, Math.trunc(product.prepDays ?? 0));
    const minLeadTimeDays = Math.max(0, Math.trunc(product.minLeadTimeDays ?? 3));
    byProductId.set(product.id, { points, prepDays, minLeadTimeDays });
    byProductType.set(product.productType, { points, prepDays, minLeadTimeDays });
  });

  return { byProductId, byProductType };
}

export function getOrderLoadDistribution(
  order: Pick<CapacityOrder, "eventDate" | "id" | "items" | "status">,
  productLookup: ReturnType<typeof buildProductPointLookup>
): Array<{ dateKey: string; points: number; isDue: boolean }> {
  if (order.status !== "confirmed") {
    return [];
  }

  let totalPoints = 0;
  let maxPrepDays = 0;

  if (order.items.length === 0) {
    totalPoints = defaultProductCapacityPoints;
    maxPrepDays = 0;
  } else {
    order.items.forEach((item) => {
      const lookup = (item.productId ? productLookup.byProductId.get(item.productId) : undefined) ||
                     productLookup.byProductType.get(item.productType) ||
                     { points: defaultProductCapacityPoints, prepDays: 0, minLeadTimeDays: 3 };
      const basePoints = normalizePositiveInteger(item.capacityPointsOverride, 0) || lookup.points;
      const quantity = normalizePositiveInteger(item.quantity, 1);
      totalPoints += basePoints * quantity;
      if (lookup.prepDays > maxPrepDays) {
        maxPrepDays = lookup.prepDays;
      }
    });
  }

  if (totalPoints <= 0) {
    return [];
  }

  const windowDays = Math.max(1, maxPrepDays + 1);
  const basePoints = Math.floor(totalPoints / windowDays);
  let remainder = totalPoints % windowDays;

  const spread = Array(windowDays).fill(basePoints);
  for (let i = windowDays - 1; i >= 0 && remainder > 0; i--) {
    spread[i] += 1;
    remainder -= 1;
  }

  const distribution: Array<{ dateKey: string; points: number; isDue: boolean }> = [];
  const cursor = new Date(`${order.eventDate}T12:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() - maxPrepDays);

  for (let i = 0; i < windowDays; i++) {
    distribution.push({
      dateKey: getDateKey(cursor),
      points: spread[i],
      isDue: i === windowDays - 1
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return distribution;
}

export function isShortLeadTime(
  eventDate: string,
  items: Pick<CapacityOrderItem, "productId" | "productType">[],
  productLookup: ReturnType<typeof buildProductPointLookup>,
  todayKey: string
): boolean {
  let minLeadTime = 3;
  if (items.length > 0) {
    minLeadTime = 0;
    items.forEach(item => {
      const lookup = (item.productId ? productLookup.byProductId.get(item.productId) : undefined) ||
                     productLookup.byProductType.get(item.productType) ||
                     { points: defaultProductCapacityPoints, prepDays: 0, minLeadTimeDays: 3 };
      if (lookup.minLeadTimeDays > minLeadTime) {
        minLeadTime = lookup.minLeadTimeDays;
      }
    });
  }
  
  const event = new Date(`${eventDate}T12:00:00.000Z`);
  const today = new Date(`${todayKey}T12:00:00.000Z`);
  
  const diffTime = event.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  
  return diffDays < minLeadTime;
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
        duePoints: 0,
        prepPoints: 0,
        contributingOrders: [] as CapacityDayLoad["contributingOrders"],
        weekStartKey: getWeekStartKey(dateKey, weekStartDay),
      },
    ]),
  );

  orders.forEach((order) => {
    const distribution = getOrderLoadDistribution(order, productPoints);

    distribution.forEach(({ dateKey, points, isDue }) => {
      const day = dayLoads.get(dateKey);

      if (!day) {
        return;
      }

      if (isDue) {
        day.orderCount += 1;
        day.duePoints += points;
      } else {
        day.prepPoints += points;
      }
      
      day.orderPoints += points;

      if (points > 0) {
        day.contributingOrders.push({
          id: order.id,
          type: isDue ? "due" : "prep",
          points
        });
      }
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

export function validateProductCapacitySettings(
  capacityPoints: number,
  prepDays: number,
  minLeadTimeDays: number
): { success: boolean; error?: string } {
  if (Number.isNaN(capacityPoints) || capacityPoints < 1 || capacityPoints > 100) {
    return { success: false, error: "Capacity points must be an integer between 1 and 100." };
  }
  if (Number.isNaN(prepDays) || prepDays < 0 || prepDays > 30) {
    return { success: false, error: "Prep days must be an integer between 0 and 30." };
  }
  if (Number.isNaN(minLeadTimeDays) || minLeadTimeDays < 0 || minLeadTimeDays > 100) {
    return { success: false, error: "Minimum lead time must be an integer between 0 and 100." };
  }
  return { success: true };
}

export function getCapacityEstimateSentence(
  weeklyCapacityCeiling: number,
  products: Array<{ id: string; name: string; is_active: boolean; capacity_points: number | null }>
): string {
  const activeProducts = products.filter((p) => p.is_active);
  const validProducts = activeProducts.filter(
    (p) => p.capacity_points !== null && p.capacity_points > 0
  );

  if (validProducts.length === 0) {
    return `Based on currently saved settings, your weekly limit of ${weeklyCapacityCeiling} points cannot be illustrated because no active products have point weights configured.`;
  }

  const sorted = [...validProducts].sort((a, b) => (a.capacity_points ?? 0) - (b.capacity_points ?? 0));
  const minProduct = sorted[0];
  const maxProduct = sorted[sorted.length - 1];

  const minPts = minProduct.capacity_points ?? 2;
  const maxPts = maxProduct.capacity_points ?? 2;

  if (weeklyCapacityCeiling < minPts) {
    return `Based on currently saved settings, even 1 order of your smallest product (${minProduct.name}, ${minPts} pts) exceeds your weekly ceiling of ${weeklyCapacityCeiling} pts.`;
  }

  const minCount = Math.floor(weeklyCapacityCeiling / minPts);
  const maxCount = Math.floor(weeklyCapacityCeiling / maxPts);

  if (minProduct.id === maxProduct.id) {
    return `Based on currently saved settings, a ${weeklyCapacityCeiling}-point week is roughly equivalent to ${minCount} ${minProduct.name} order${minCount === 1 ? "" : "s"} (${minPts} pts each).`;
  }

  if (maxCount > 0) {
    return `Based on currently saved settings, a ${weeklyCapacityCeiling}-point week is roughly equivalent to ${minCount} ${minProduct.name} order${minCount === 1 ? "" : "s"} (${minPts} pts each), ${maxCount} larger ${maxProduct.name} order${maxCount === 1 ? "" : "s"} (${maxPts} pts each), or a mixed workload.`;
  }

  return `Based on currently saved settings, a ${weeklyCapacityCeiling}-point week is roughly equivalent to ${minCount} ${minProduct.name} order${minCount === 1 ? "" : "s"} (${minPts} pts each) or a mixed workload.`;
}

