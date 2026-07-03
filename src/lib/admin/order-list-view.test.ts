import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { buildCombinedPaymentPill, filterOrdersByQueue, filterOrdersBySearch, getOrderRelativeDateLabel, groupOrdersByDueDate } from "./order-list-view.ts";

const baseOrder = {
  balanceDue: 0,
  balanceDueLabel: "$0",
  customerLabel: "Sarah M.",
  eventDate: "2026-07-10",
  eventType: "Birthday",
  id: "order-1",
  referenceCode: "ORD-ABCDEFGH",
  status: "confirmed" as const,
  totalAmount: 100,
  totalLabel: "$100",
};

describe("order due-date grouping", () => {
  it("groups non-completed orders by urgency and sorts each section by due date", () => {
    const grouped = groupOrdersByDueDate(
      [
        { ...baseOrder, id: "later", eventDate: "2026-08-15" },
        { ...baseOrder, id: "next-week", eventDate: "2026-07-15" },
        { ...baseOrder, id: "this-week-late", eventDate: "2026-07-08" },
        { ...baseOrder, id: "overdue", eventDate: "2026-07-01" },
        { ...baseOrder, id: "this-week-early", eventDate: "2026-07-04" },
      ],
      "2026-07-03",
    );

    assert.deepEqual(
      grouped.map((section) => section.label),
      ["Overdue", "This week", "Next week", "Later"],
    );
    assert.deepEqual(
      grouped.find((section) => section.key === "this-week")?.entries.map((entry) => entry.id),
      ["this-week-early", "this-week-late"],
    );
  });

  it("keeps completed past orders out of the overdue section", () => {
    const grouped = groupOrdersByDueDate(
      [{ ...baseOrder, id: "done", eventDate: "2026-07-01", status: "completed" as const }],
      "2026-07-03",
    );

    assert.equal(grouped.length, 0);
  });

  it("keeps fulfilled past orders out of the overdue section", () => {
    const grouped = groupOrdersByDueDate(
      [{ ...baseOrder, id: "fulfilled", eventDate: "2026-07-01", status: "fulfilled" as const }],
      "2026-07-03",
    );

    assert.equal(grouped.length, 0);
  });

  it("sorts overdue orders oldest first", () => {
    const grouped = groupOrdersByDueDate(
      [
        { ...baseOrder, id: "two-days-overdue", eventDate: "2026-07-01" },
        { ...baseOrder, id: "oldest-overdue", eventDate: "2026-06-20" },
        { ...baseOrder, id: "one-day-overdue", eventDate: "2026-07-02" },
      ],
      "2026-07-03",
    );

    assert.deepEqual(grouped[0]?.entries.map((entry) => entry.id), [
      "oldest-overdue",
      "two-days-overdue",
      "one-day-overdue",
    ]);
  });

  it("formats compact relative due-date labels", () => {
    assert.equal(getOrderRelativeDateLabel("2026-07-03", "2026-07-03"), "today");
    assert.equal(getOrderRelativeDateLabel("2026-07-04", "2026-07-03"), "tomorrow");
    assert.equal(getOrderRelativeDateLabel("2026-07-15", "2026-07-03"), "in 12 days");
    assert.equal(getOrderRelativeDateLabel("2026-07-01", "2026-07-03"), "2 days overdue");
  });
});

describe("order list queue filtering", () => {
  const orders = [
    { ...baseOrder, id: "confirmed", eventDate: "2026-07-15", status: "confirmed" as const },
    { ...baseOrder, id: "fulfilled", eventDate: "2026-07-15", status: "fulfilled" as const },
    { ...baseOrder, id: "completed", eventDate: "2026-07-15", status: "completed" as const },
    { ...baseOrder, id: "cancelled", eventDate: "2026-07-15", status: "cancelled" as const },
  ];

  it("keeps fulfilled and completed orders out of the active queue", () => {
    assert.deepEqual(filterOrdersByQueue(orders, "active", "2026-07-03").map((entry) => entry.id), [
      "confirmed",
    ]);
  });

  it("keeps fulfilled and completed orders out of awaiting payment", () => {
    const awaitingOrders = orders.map((order) => ({
      ...order,
      balanceDue: 100,
      balanceDueLabel: "$100",
      paymentState: "unpaid" as const,
    }));

    assert.deepEqual(
      filterOrdersByQueue(awaitingOrders, "awaiting-payment", "2026-07-03").map((entry) => entry.id),
      ["confirmed"],
    );
  });

  it("keeps fulfilled and completed orders available in the completed queue", () => {
    assert.deepEqual(
      filterOrdersByQueue(orders, "completed", "2026-07-03").map((entry) => entry.id),
      ["fulfilled", "completed"],
    );
  });
});

describe("order list search", () => {
  it("filters by customer, occasion, and order number case-insensitively", () => {
    const orders = [
      { ...baseOrder, customerLabel: "Sarah M.", eventType: "Birthday", referenceCode: "ORD-AAA11111" },
      { ...baseOrder, customerLabel: "Mina R.", eventType: "Wedding", referenceCode: "ORD-BBB22222" },
    ];

    assert.deepEqual(filterOrdersBySearch(orders, "wedding").map((entry) => entry.referenceCode), [
      "ORD-BBB22222",
    ]);
    assert.deepEqual(filterOrdersBySearch(orders, "aaa111").map((entry) => entry.customerLabel), [
      "Sarah M.",
    ]);
  });
});

describe("combined payment pill", () => {
  it("uses an attention tone when there is a balance due", () => {
    assert.deepEqual(
      buildCombinedPaymentPill({
        balanceDue: 100,
        balanceDueLabel: "$100",
        totalAmount: 100,
        totalLabel: "$100",
      }),
      {
        label: "$100 due of $100",
        tone: "attention",
      },
    );
  });

  it("uses a paid tone when the order has no balance", () => {
    assert.deepEqual(
      buildCombinedPaymentPill({
        balanceDue: 0,
        balanceDueLabel: "$0",
        totalAmount: 100,
        totalLabel: "$100",
      }),
      {
        label: "$100 paid",
        tone: "paid",
      },
    );
  });
});
