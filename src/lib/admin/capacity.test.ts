import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { buildCapacityLoad, getOrderLoadDateKeys } from "./capacity.ts";

const products = [
  { capacityPoints: 2, id: "custom-cake", productType: "custom-cake" },
  { capacityPoints: 4, id: "wedding-cake", productType: "wedding-cake" },
];

describe("calendar capacity load", () => {
  it("keeps order load attribution behind a single date-mapping function", () => {
    assert.deepEqual(
      getOrderLoadDateKeys({
        eventDate: "2026-07-18",
        id: "order-1",
        items: [],
        status: "confirmed",
      }),
      ["2026-07-18"],
    );
  });

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
      startDateKey: "2026-07-18",
      weeklyCapacityCeiling: 12,
      weekStartDay: 0,
    });

    assert.equal(capacity.days[0]?.orderPoints, 7);
    assert.equal(capacity.days[0]?.orderCount, 1);
    assert.equal(capacity.days[0]?.inquiryCount, 1);
    assert.equal(capacity.days[0]?.loadState, "full");
  });

  it("marks a light day overbooked when its week exceeds the ceiling", () => {
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

  it("includes outside-month days in week totals", () => {
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
});
