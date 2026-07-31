import "server-only";

import { calculateOrderPaymentSnapshot } from "@/lib/admin/order-payments";
import { getInquiryReferenceCode, mergeOrderWorkflowMetadata } from "@/lib/admin/order-workflow";
import { getIntegrationConfig } from "@/lib/integrations/config";
import {
  findIntegrationLink,
  getIntegrationConnection,
  markIntegrationFailure,
  markIntegrationSuccess,
  recordSyncConflict,
  upsertIntegrationLink,
} from "@/lib/integrations/repository";
import {
  createSquareCustomer,
  createSquareInvoice,
  createSquareOrder,
  findSquareCustomerByEmail,
  getSquareInvoice,
  listSquarePayments,
  moneyToCents,
  publishSquareInvoice,
  squareIdempotencyKey,
  SquareIntegrationError,
} from "@/lib/integrations/square";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert, TablesUpdate } from "@/types/supabase.generated";
import { handleConfirmedOrderIntegrations } from "@/lib/integrations/order-lifecycle";

type InvoiceOrderRow = {
  customer_id: string;
  customers: { email: string | null; full_name: string; phone: string | null } | null;
  deposit_due_amount: number;
  event_date: string;
  event_type: string;
  final_due_at: string | null;
  fulfillment_method: string;
  id: string;
  inquiries: { id: string; metadata: Json } | null;
  metadata: Json;
  order_items: Array<{ product_label: string; quantity: number }>;
  status: string;
  total_amount: number;
};

function safeReference(order: InvoiceOrderRow) {
  return order.inquiries
    ? getInquiryReferenceCode(order.inquiries)
    : `ORD-${order.id.slice(0, 8).toUpperCase()}`;
}

async function assertSquareReady() {
  const config = getIntegrationConfig().square;
  const connection = await getIntegrationConnection("square");

  if (!config.enabled || !connection?.enabled || connection.status === "disabled") {
    throw new SquareIntegrationError("square-disabled");
  }
}

export async function sendSquareInvoiceForOrder(orderId: string) {
  await assertSquareReady();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_id, status, total_amount, deposit_due_amount, final_due_at, event_date, event_type, fulfillment_method, metadata, customers(full_name, email, phone), inquiries(id, metadata), order_items(product_label, quantity)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) throw new SquareIntegrationError("order-not-found");
  const order = data as InvoiceOrderRow;

  if (order.status !== "quoted") throw new SquareIntegrationError("order-not-quoted");
  if (!order.customers?.email) throw new SquareIntegrationError("customer-email-required");
  if (order.total_amount <= 0) throw new SquareIntegrationError("order-total-required");

  const existingInvoice = await findIntegrationLink({
    externalEntityType: "invoice",
    localEntityId: order.id,
    localEntityType: "order",
    provider: "square",
  });
  if (existingInvoice) throw new SquareIntegrationError("invoice-already-exists");

  const reference = safeReference(order);
  let customerLink = await findIntegrationLink({
    externalEntityType: "customer",
    localEntityId: order.customer_id,
    localEntityType: "customer",
    provider: "square",
  });
  let squareCustomerId = customerLink?.external_id;

  if (!squareCustomerId) {
    const existing = await findSquareCustomerByEmail(order.customers.email);
    const squareCustomer = existing ?? await createSquareCustomer({
      email: order.customers.email,
      idempotencyKey: squareIdempotencyKey("customer", order.customer_id),
      name: order.customers.full_name,
      phone: order.customers.phone,
      referenceId: order.customer_id,
    });
    squareCustomerId = squareCustomer.id;
    customerLink = await upsertIntegrationLink({
      external_entity_type: "customer",
      external_id: squareCustomerId,
      local_entity_id: order.customer_id,
      local_entity_type: "customer",
      provider: "square",
    });
  }

  let squareOrderLink = await findIntegrationLink({
    externalEntityType: "order",
    localEntityId: order.id,
    localEntityType: "order",
    provider: "square",
  });
  let squareOrderId = squareOrderLink?.external_id;

  if (!squareOrderId) {
    const itemSummary = order.order_items
      .map((item) => `${item.quantity} × ${item.product_label}`)
      .join(", ")
      .slice(0, 240);
    const squareOrder = await createSquareOrder({
      customerId: squareCustomerId,
      idempotencyKey: squareIdempotencyKey("order", order.id),
      note: itemSummary || `${order.event_type} bakery order`,
      referenceId: reference,
      totalCents: moneyToCents(order.total_amount),
    });
    squareOrderId = squareOrder.id;
    squareOrderLink = await upsertIntegrationLink({
      external_entity_type: "order",
      external_id: squareOrderId,
      external_version: squareOrder.version ? String(squareOrder.version) : null,
      local_entity_id: order.id,
      local_entity_type: "order",
      provider: "square",
    });
  }

  const invoice = await createSquareInvoice({
    balanceDueDate: order.final_due_at?.slice(0, 10) ?? order.event_date,
    customerId: squareCustomerId,
    depositCents: moneyToCents(order.deposit_due_amount),
    idempotencyKey: squareIdempotencyKey("invoice", order.id),
    invoiceNumber: reference,
    orderId: squareOrderId,
    title: `${order.event_type} · ${order.fulfillment_method}`,
    totalCents: moneyToCents(order.total_amount),
  });
  const published = await publishSquareInvoice(
    invoice,
    squareIdempotencyKey("publish", order.id, invoice.id),
  );

  await upsertIntegrationLink({
    external_entity_type: "invoice",
    external_id: published.id,
    external_parent_id: squareOrderId,
    external_version: String(published.version),
    local_entity_id: order.id,
    local_entity_type: "order",
    metadata: { customerLinkId: customerLink?.id ?? null, orderLinkId: squareOrderLink?.id ?? null },
    provider: "square",
  });

  const metadata = mergeOrderWorkflowMetadata(order.metadata, {
    squareInvoiceNumber: published.invoice_number ?? reference,
    squareInvoiceStatus: published.status ?? "UNPAID",
    squareInvoiceUrl: published.public_url ?? null,
  });
  const { error: updateError } = await supabase
    .from("orders")
    .update({ metadata })
    .eq("id", order.id);
  if (updateError) throw updateError;

  await markIntegrationSuccess("square");
  return published;
}

export async function reconcileSquareInvoice(invoiceId: string) {
  await assertSquareReady();
  const invoiceLink = await findIntegrationLink({
    externalEntityType: "invoice",
    externalId: invoiceId,
    provider: "square",
  });
  if (!invoiceLink) return { ignored: true };

  const supabase = createAdminClient();
  const invoice = await getSquareInvoice(invoiceId);
  const squarePayments = (await listSquarePayments(invoice.order_id))
    .filter((payment) => payment.status === "COMPLETED")
    .sort((left, right) => (left.created_at ?? "").localeCompare(right.created_at ?? ""));
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_id, status, payment_status, total_amount, deposit_due_amount, metadata, payments(id, amount, payment_type, status, provider_name, provider_intent_id)")
    .eq("id", invoiceLink.local_entity_id)
    .maybeSingle();
  if (error || !order) throw new SquareIntegrationError("linked-order-not-found");

  let allocatedPaidCents = 0;
  for (const payment of squarePayments) {
    const amountCents = payment.amount_money?.amount ?? 0;
    if (amountCents <= 0) continue;
    const existing = order.payments.find((row) => row.provider_name === "square" && row.provider_intent_id === payment.id);
    const paymentType = allocatedPaidCents === 0 && amountCents >= moneyToCents(order.total_amount)
      ? "full"
      : allocatedPaidCents < moneyToCents(order.deposit_due_amount)
        ? "deposit"
        : "balance";
    const values: TablesUpdate<"payments"> = {
      amount: amountCents / 100,
      method: "card",
      paid_at: payment.updated_at ?? payment.created_at ?? new Date().toISOString(),
      payment_type: paymentType,
      provider_intent_id: payment.id,
      provider_name: "square",
      reference_code: invoice.invoice_number ?? invoice.id,
      status: "paid",
    };

    if (existing) {
      const { error: paymentError } = await supabase.from("payments").update(values).eq("id", existing.id);
      if (paymentError) throw paymentError;
    } else {
      const pendingDeposit = paymentType === "deposit"
        ? order.payments.find((row) => row.payment_type === "deposit" && row.status === "pending" && !row.provider_intent_id)
        : null;
      if (pendingDeposit) {
        const { error: paymentError } = await supabase.from("payments").update(values).eq("id", pendingDeposit.id);
        if (paymentError) throw paymentError;
      } else {
        const { error: paymentError } = await supabase.from("payments").insert({
          ...values,
          amount: amountCents / 100,
          customer_id: order.customer_id,
          order_id: order.id,
          payment_type: paymentType,
        } satisfies TablesInsert<"payments">);
        if (paymentError) throw paymentError;
      }
    }

    const refundCents = payment.refunded_money?.amount ?? 0;
    if (refundCents > 0) {
      const refundIntentId = `${payment.id}:refund:${refundCents}`;
      const refundInsert: TablesInsert<"payments"> = {
        amount: refundCents / 100,
        customer_id: order.customer_id,
        method: "card",
        notes: "Synchronized from Square refund activity.",
        order_id: order.id,
        paid_at: payment.updated_at ?? new Date().toISOString(),
        payment_type: "refund",
        provider_intent_id: refundIntentId,
        provider_name: "square",
        reference_code: invoice.invoice_number ?? invoice.id,
        status: "refunded",
      };
      const { error: refundError } = await supabase
        .from("payments")
        .upsert(refundInsert, { onConflict: "provider_name,provider_intent_id" });
      if (refundError) throw refundError;
    }
    allocatedPaidCents += amountCents;
  }

  const { data: reloaded, error: reloadError } = await supabase
    .from("orders")
    .select("id, total_amount, deposit_due_amount, status, metadata, payments(amount, payment_type, status)")
    .eq("id", order.id)
    .single();
  if (reloadError) throw reloadError;
  const snapshot = calculateOrderPaymentSnapshot(reloaded, reloaded.payments ?? []);
  const shouldConfirm = reloaded.deposit_due_amount > 0 && snapshot.depositPaid >= reloaded.deposit_due_amount;
  const metadata = mergeOrderWorkflowMetadata(reloaded.metadata, {
    squareInvoiceNumber: invoice.invoice_number ?? null,
    squareInvoiceStatus: invoice.status ?? null,
    squareInvoiceUrl: invoice.public_url ?? null,
  });
  const update: TablesUpdate<"orders"> = {
    balance_due_amount: snapshot.balanceDue,
    metadata,
    payment_status: snapshot.paymentStatus,
  };
  if (shouldConfirm && ["draft", "quoted"].includes(reloaded.status)) {
    update.confirmed_at = new Date().toISOString();
    update.status = "confirmed";
  }
  const { error: updateError } = await supabase.from("orders").update(update).eq("id", order.id);
  if (updateError) throw updateError;
  if (update.status === "confirmed") {
    await handleConfirmedOrderIntegrations(order.id);
  }

  const expectedCents = moneyToCents(order.total_amount);
  const invoiceCents = (invoice.payment_requests ?? []).reduce(
    (sum, request) => sum + (request.computed_amount_money?.amount ?? 0),
    0,
  );
  if (invoiceCents > 0 && invoiceCents !== expectedCents) {
    await recordSyncConflict({
      conflictType: "square-total-mismatch",
      externalValue: invoiceCents,
      fieldName: "total_amount",
      integrationLinkId: invoiceLink.id,
      localEntityId: order.id,
      localEntityType: "order",
      localValue: expectedCents,
      provider: "square",
    });
  }

  await markIntegrationSuccess("square");
  return { confirmed: shouldConfirm, ignored: false, orderId: order.id };
}

export async function reconcileAllSquareInvoices() {
  try {
    await assertSquareReady();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("integration_links")
      .select("external_id")
      .eq("provider", "square")
      .eq("external_entity_type", "invoice");
    if (error) throw error;

    for (const link of data ?? []) {
      await reconcileSquareInvoice(link.external_id);
    }
    return { count: data?.length ?? 0 };
  } catch (error) {
    const code = error instanceof SquareIntegrationError ? error.code : "square-reconcile-failed";
    await markIntegrationFailure("square", code).catch(() => undefined);
    throw error;
  }
}
