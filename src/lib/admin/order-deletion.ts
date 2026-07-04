import type { AdminRole } from "@/types/domain";

type DeleteActor = {
  role: AdminRole | string;
} | null;

type OrderDeleteRow = {
  customer_id: string | null;
  id: string;
  inquiry_id: string | null;
  status: string;
};

type DeleteOperation = "delete" | "load";

type SafeDeleteDiagnostic = {
  code?: string;
  constraint?: string;
  operation: DeleteOperation;
  table?: string;
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
      diagnostic?: SafeDeleteDiagnostic;
      ok: false;
      reason: "delete-failed" | "invalid-id" | "load-failed" | "not-cancelled" | "not-found";
    };

export const ORDER_DELETE_CONFIRMATION_TEXT = "DELETE";

const postgresUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readStringField(value: unknown, field: string) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const fieldValue = (value as Record<string, unknown>)[field];
  return typeof fieldValue === "string" && fieldValue ? fieldValue : undefined;
}

function getSafeDeleteDiagnostic(error: unknown, operation: DeleteOperation): SafeDeleteDiagnostic {
  return {
    code: readStringField(error, "code"),
    constraint: readStringField(error, "constraint"),
    operation,
    table: readStringField(error, "table"),
  };
}

export function canPermanentlyDeleteOrder(actor: DeleteActor) {
  return actor?.role === "owner";
}

export function isOrderDeleteConfirmationValid(value: unknown) {
  return value === ORDER_DELETE_CONFIRMATION_TEXT;
}

export function getOrderDeletionEligibility({
  actor,
  status,
}: {
  actor: DeleteActor;
  status: string;
}):
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "not-cancelled" | "owner-only";
    } {
  if (!canPermanentlyDeleteOrder(actor)) {
    return { ok: false, reason: "owner-only" };
  }

  if (status !== "cancelled") {
    return { ok: false, reason: "not-cancelled" };
  }

  return { ok: true };
}

export async function deleteOrderRecord(
  client: OrderDeleteClient,
  orderId: string,
): Promise<DeleteOrderResult> {
  if (!postgresUuidPattern.test(orderId)) {
    return { ok: false, reason: "invalid-id" };
  }

  const { data: order, error: loadError } = await client
    .from("orders")
    .select("id, customer_id, inquiry_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (loadError) {
    return {
      diagnostic: getSafeDeleteDiagnostic(loadError, "load"),
      ok: false,
      reason: "load-failed",
    };
  }

  if (!order) {
    return { ok: false, reason: "not-found" };
  }

  if (order.status !== "cancelled") {
    return { ok: false, reason: "not-cancelled" };
  }

  const { error: deleteError } = await client.from("orders").delete().eq("id", orderId);

  if (deleteError) {
    return {
      diagnostic: getSafeDeleteDiagnostic(deleteError, "delete"),
      ok: false,
      reason: "delete-failed",
    };
  }

  return {
    customerId: order.customer_id,
    inquiryId: order.inquiry_id,
    ok: true,
  };
}
