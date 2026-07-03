import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { buildCapacityLoad, getOrderLoadDistribution, buildProductPointLookup } from "./capacity.ts";

const products = [
  { capacityPoints: 2, id: "custom-cake", productType: "custom-cake", prepDays: 0, minLeadTimeDays: 3 },
  { capacityPoints: 4, id: "wedding-cake", productType: "wedding-cake", prepDays: 2, minLeadTimeDays: 14 },
  { capacityPoints: 8, id: "big-cake", productType: "big-cake", prepDays: 2, minLeadTimeDays: 7 },
];

describe("calendar capacity load distribution", () => {
  it("0 prep days -> all points on due date", () => {
    const lookup = buildProductPointLookup(products);
    const distribution = getOrderLoadDistribution({
      eventDate: "2026-07-18",
      id: "order-1",
      items: [{ capacityPointsOverride: null, productId: "custom-cake", productType: "custom-cake", quantity: 1 }],
      status: "confirmed",
    }, lookup);
    
    assert.deepEqual(distribution, [
      { dateKey: "2026-07-18", points: 2, isDue: true }
    ]);
  });

  it("8 pts / 2 prep days -> 2/3/3", () => {
    const lookup = buildProductPointLookup(products);
    const distribution = getOrderLoadDistribution({
      eventDate: "2026-07-18",
      id: "order-1",
      items: [{ capacityPointsOverride: null, productId: "big-cake", productType: "big-cake", quantity: 1 }],
      status: "confirmed",
    }, lookup);
    
    assert.deepEqual(distribution, [
      { dateKey: "2026-07-16", points: 2, isDue: false },
      { dateKey: "2026-07-17", points: 3, isDue: false },
      { dateKey: "2026-07-18", points: 3, isDue: true },
    ]);
  });

  it("2 pts / 2 prep days -> 0/1/1", () => {
    const lookup = buildProductPointLookup([
      { capacityPoints: 2, id: "small-prep-cake", productType: "small-prep-cake", prepDays: 2, minLeadTimeDays: 3 }
    ]);
    const distribution = getOrderLoadDistribution({
      eventDate: "2026-07-18",
      id: "order-1",
      items: [{ capacityPointsOverride: null, productId: "small-prep-cake", productType: "small-prep-cake", quantity: 1 }],
      status: "confirmed",
    }, lookup);
    
    assert.deepEqual(distribution, [
      { dateKey: "2026-07-16", points: 0, isDue: false },
      { dateKey: "2026-07-17", points: 1, isDue: false },
      { dateKey: "2026-07-18", points: 1, isDue: true },
    ]);
  });

  it("multi-item max-window and capacity_points_override respected", () => {
    const lookup = buildProductPointLookup([
      { capacityPoints: 2, id: "item1", productType: "item1", prepDays: 1, minLeadTimeDays: 3 },
      { capacityPoints: 4, id: "item2", productType: "item2", prepDays: 3, minLeadTimeDays: 3 },
    ]);
    // items: item1 (points=2, prep=1), item2 (override=6, prep=3) -> total 8 pts, max prep = 3
    // window = 4. 8 / 4 -> 2/2/2/2
    const distribution = getOrderLoadDistribution({
      eventDate: "2026-07-18",
      id: "order-1",
      items: [
        { capacityPointsOverride: null, productId: "item1", productType: "item1", quantity: 1 },
        { capacityPointsOverride: 6, productId: "item2", productType: "item2", quantity: 1 },
      ],
      status: "confirmed",
    }, lookup);
    
    assert.deepEqual(distribution, [
      { dateKey: "2026-07-15", points: 2, isDue: false },
      { dateKey: "2026-07-16", points: 2, isDue: false },
      { dateKey: "2026-07-17", points: 2, isDue: false },
      { dateKey: "2026-07-18", points: 2, isDue: true },
    ]);
  });

  it("window crossing a month boundary", () => {
    const lookup = buildProductPointLookup([
      { capacityPoints: 4, id: "cake", productType: "cake", prepDays: 2, minLeadTimeDays: 3 }
    ]);
    const distribution = getOrderLoadDistribution({
      eventDate: "2026-08-01",
      id: "order-1",
      items: [{ capacityPointsOverride: null, productId: "cake", productType: "cake", quantity: 1 }],
      status: "confirmed",
    }, lookup);
    
    assert.deepEqual(distribution, [
      { dateKey: "2026-07-30", points: 1, isDue: false },
      { dateKey: "2026-07-31", points: 1, isDue: false },
      { dateKey: "2026-08-01", points: 2, isDue: true },
    ]);
  });
  
  it("window crossing a week boundary", () => {
    // 2026-07-18 is Saturday, 2026-07-20 is Monday
    const lookup = buildProductPointLookup([
      { capacityPoints: 3, id: "cake", productType: "cake", prepDays: 2, minLeadTimeDays: 3 }
    ]);
    const distribution = getOrderLoadDistribution({
      eventDate: "2026-07-20", // Monday
      id: "order-1",
      items: [{ capacityPointsOverride: null, productId: "cake", productType: "cake", quantity: 1 }],
      status: "confirmed",
    }, lookup);
    
    assert.deepEqual(distribution, [
      { dateKey: "2026-07-18", points: 1, isDue: false }, // Sat
      { dateKey: "2026-07-19", points: 1, isDue: false }, // Sun
      { dateKey: "2026-07-20", points: 1, isDue: true },  // Mon
    ]);
  });
});

describe("calendar capacity load", () => {
  it("scores confirmed orders by product points and item override only", () => {
    const capacity = buildCapacityLoad({
      endDateKey: "2026-07-18",
      inquiries: [
        { eventDate: "2026-07-18", id: "inquiry-active", status: "new" },
        { eventDate: "2026-07-18", id: "inquiry-declined", status: "declined" },
      ],
      orders: [
        {
          eventDate: "2026-07-18",
          id: "confirmed-order",
          items: [
            { capacityPointsOverride: null, productId: "custom-cake", productType: "custom-cake", quantity: 1 },
            { capacityPointsOverride: 5, productId: null, productType: "wedding-cake", quantity: 1 },
          ],
          status: "confirmed",
        },
        {
          eventDate: "2026-07-18",
          id: "cancelled-order",
          items: [{ capacityPointsOverride: null, productId: "wedding-cake", productType: "wedding-cake", quantity: 1 }],
          status: "cancelled",
        },
      ],
      products,
      startDateKey: "2026-07-15",
      weeklyCapacityCeiling: 12,
      weekStartDay: 0,
    });

    const day18 = capacity.days.find(d => d.dateKey === "2026-07-18")!;
    // The wedding cake has prep=2, custom cake prep=0
    // Total order: custom (2pt, 0 prep), wedding (5pt override, 2 prep) -> total 7 pts, prep max = 2
    // spread window = 3 days. 7/3 -> base=2, rem=1 -> 2, 2, 3
    assert.equal(day18.orderPoints, 3);
    assert.equal(day18.orderCount, 1);
    assert.equal(day18.inquiryCount, 1);
    
    const day17 = capacity.days.find(d => d.dateKey === "2026-07-17")!;
    assert.equal(day17.orderPoints, 2);
    assert.equal(day17.orderCount, 0); // only prep load
  });

  it("marks a light day overbooked when its week exceeds the ceiling (restored from Phase 6)", () => {
    const capacity = buildCapacityLoad({
      endDateKey: "2026-07-11",
      inquiries: [],
      orders: [
        {
          eventDate: "2026-07-05",
          id: "order-sun",
          items: [{ capacityPointsOverride: null, productId: "custom-cake", productType: "custom-cake", quantity: 1 }],
          status: "confirmed",
        },
        {
          eventDate: "2026-07-06",
          id: "order-mon",
          items: [{ capacityPointsOverride: 11, productId: null, productType: "custom-cake", quantity: 1 }],
          status: "confirmed",
        },
      ],
      products,
      startDateKey: "2026-07-05",
      weeklyCapacityCeiling: 12,
      weekStartDay: 0,
    });

    assert.equal(capacity.days.find((day) => day.dateKey === "2026-07-05")?.orderPoints, 2);
    assert.equal(capacity.weeks[0]?.orderPoints, 13);
    assert.equal(capacity.days.find((day) => day.dateKey === "2026-07-05")?.loadState, "overbooked");
    assert.equal(capacity.weeks[0]?.loadState, "overbooked");
  });

  it("includes outside-month days in week totals (restored from Phase 6)", () => {
    const capacity = buildCapacityLoad({
      endDateKey: "2026-08-01",
      inquiries: [],
      orders: [
        {
          eventDate: "2026-07-31",
          id: "july-order",
          items: [{ capacityPointsOverride: 6, productId: null, productType: "custom-cake", quantity: 1 }],
          status: "confirmed",
        },
        {
          eventDate: "2026-08-01",
          id: "august-order",
          items: [{ capacityPointsOverride: 6, productId: null, productType: "custom-cake", quantity: 1 }],
          status: "confirmed",
        },
      ],
      products,
      startDateKey: "2026-07-26",
      weeklyCapacityCeiling: 12,
      weekStartDay: 0,
    });

    assert.equal(capacity.weeks[0]?.weekStartKey, "2026-07-26");
    assert.equal(capacity.weeks[0]?.orderPoints, 12);
    assert.equal(capacity.days.find((day) => day.dateKey === "2026-07-31")?.loadState, "full");
  });

  it("multiplies base points by quantity and spreads properly", () => {
    const lookup = buildProductPointLookup(products);
    const distribution = getOrderLoadDistribution({
      eventDate: "2026-07-18",
      id: "order-1",
      items: [{ capacityPointsOverride: null, productId: "custom-cake", productType: "custom-cake", quantity: 3 }],
      status: "confirmed",
    }, lookup);
    
    // custom-cake points = 2, quantity = 3 -> total points = 6. prep = 0.
    assert.deepEqual(distribution, [
      { dateKey: "2026-07-18", points: 6, isDue: true }
    ]);
  });
});
