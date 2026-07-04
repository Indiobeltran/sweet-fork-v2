import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { canDeleteOrder, deleteOrderRecord } from "./order-deletion.ts";

const orderId = "11111111-1111-4111-8111-111111111111";

function createDeleteClient({
  deleteError = null,
  order = { customer_id: "customer-1", id: orderId, inquiry_id: "inquiry-1" },
  selectError = null,
}: {
  deleteError?: Error | null;
  order?: { customer_id: string; id: string; inquiry_id: string | null } | null;
  selectError?: Error | null;
}) {
  const calls: Array<{ column?: string; table: string; type: "delete" | "eq" | "select"; value?: string }> = [];

  return {
    calls,
    from(table: string) {
      return {
        delete() {
          calls.push({ table, type: "delete" });

          return {
            async eq(column: string, value: string) {
              calls.push({ column, table, type: "eq", value });
              return { error: deleteError };
            },
          };
        },
        select() {
          calls.push({ table, type: "select" });

          return {
            eq(column: string, value: string) {
              calls.push({ column, table, type: "eq", value });

              return {
                async maybeSingle() {
                  return { data: order, error: selectError };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("order deletion authorization", () => {
  it("allows only Sweet Fork admin roles to delete orders", () => {
    assert.equal(canDeleteOrder({ role: "owner" }), true);
    assert.equal(canDeleteOrder({ role: "manager" }), true);
    assert.equal(canDeleteOrder({ role: "customer" }), false);
    assert.equal(canDeleteOrder(null), false);
  });
});

describe("deleteOrderRecord", () => {
  it("accepts valid PostgreSQL UUID values even when they are not RFC versioned UUIDs", async () => {
    const legacyOrderId = "00000000-0000-0000-0000-000000000002";
    const client = createDeleteClient({
      order: { customer_id: "customer-1", id: legacyOrderId, inquiry_id: null },
    });

    const result = await deleteOrderRecord(client, legacyOrderId);

    assert.deepEqual(result, {
      customerId: "customer-1",
      inquiryId: null,
      ok: true,
    });
    assert.equal(client.calls.some((call) => call.type === "delete"), true);
  });

  it("rejects malformed UUID values before querying the database", async () => {
    const client = createDeleteClient({});

    const result = await deleteOrderRecord(client, "not-a-uuid");

    assert.deepEqual(result, { ok: false, reason: "invalid-id" });
    assert.deepEqual(client.calls, []);
  });

  it("deletes only from the orders table by id", async () => {
    const client = createDeleteClient({});

    const result = await deleteOrderRecord(client, orderId);

    assert.deepEqual(result, {
      customerId: "customer-1",
      inquiryId: "inquiry-1",
      ok: true,
    });
    assert.deepEqual(client.calls, [
      { table: "orders", type: "select" },
      { column: "id", table: "orders", type: "eq", value: orderId },
      { table: "orders", type: "delete" },
      { column: "id", table: "orders", type: "eq", value: orderId },
    ]);
  });

  it("does not delete when the order cannot be loaded", async () => {
    const client = createDeleteClient({ order: null });

    const result = await deleteOrderRecord(client, orderId);

    assert.deepEqual(result, { ok: false, reason: "not-found" });
    assert.equal(client.calls.some((call) => call.type === "delete"), false);
  });

  it("reports delete failure without returning success", async () => {
    const client = createDeleteClient({
      deleteError: {
        code: "23503",
        constraint: "example_order_id_fkey",
        table: "example_table",
      } as unknown as Error,
    });

    const result = await deleteOrderRecord(client, orderId);

    assert.deepEqual(result, {
      diagnostic: {
        code: "23503",
        constraint: "example_order_id_fkey",
        operation: "delete",
        table: "example_table",
      },
      ok: false,
      reason: "delete-failed",
    });
  });
});
