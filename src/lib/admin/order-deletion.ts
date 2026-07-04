import type { AdminRole } from "@/types/domain";

type DeleteActor = {
  role: AdminRole | string;
} | null;

type OrderDeleteRow = {
  customer_id: string | null;
  id: string;
  inquiry_id: string | null;
};

export type OrderDeleteClient = {
  from(table: "orders"): {
    delete(): {
      eq(column: "id", value: string): PromiseLike<{ error: unknown }>;
    };
    select(columns: string): {
      eq(column: "id", value: string): {
        maybeSingle(): PromiseLike<{ data: OrderDeleteRow | null; error: unknown }>;
      };
    };
  };
};

export type DeleteOrderResult =
  | {
      customerId: string | null;
      inquiryId: string | null;
      ok: true;
    }
  | {
      ok: false;
      reason: "delete-failed" | "invalid-id" | "not-found";
    };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function canDeleteOrder(actor: DeleteActor) {
  return actor?.role === "owner" || actor?.role === "manager";
}

export async function deleteOrderRecord(
  client: OrderDeleteClient,
  orderId: string,
): Promise<DeleteOrderResult> {
  if (!uuidPattern.test(orderId)) {
    return { ok: false, reason: "invalid-id" };
  }

  const { data: order, error: loadError } = await client
    .from("orders")
    .select("id, customer_id, inquiry_id")
    .eq("id", orderId)
    .maybeSingle();

  if (loadError || !order) {
    return { ok: false, reason: "not-found" };
  }

  const { error: deleteError } = await client.from("orders").delete().eq("id", orderId);

  if (deleteError) {
    return { ok: false, reason: "delete-failed" };
  }

  return {
    customerId: order.customer_id,
    inquiryId: order.inquiry_id,
    ok: true,
  };
}
