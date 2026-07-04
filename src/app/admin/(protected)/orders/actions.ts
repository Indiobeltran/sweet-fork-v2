"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseAmount,
  parseDateInputAsIso,
  parseOptionalString,
  parseRequiredString,
  redirectWithNotice,
} from "@/lib/admin/action-helpers";
import {
  calculateOrderPaymentSnapshot,
  getStoredPaymentType,
  mergeOrderWorkflowMetadata,
} from "@/lib/admin/order-workflow";
import {
  canDeleteOrder,
  deleteOrderRecord,
  type OrderDeleteClient,
} from "@/lib/admin/order-deletion";
import { validateManualOrderPaymentAmounts } from "@/lib/admin/order-payments";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Constants,
  type Enums,
  type Tables,
  type TablesInsert,
  type TablesUpdate,
} from "@/types/supabase.generated";

type OrderStatusTransitionRow = {
  cancelled_at: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  fulfilled_at: string | null;
  quoted_at: string | null;
};

type InquiryRollbackSnapshot = Pick<
  Tables<"inquiries">,
  "customer_id" | "id" | "reviewed_at" | "status"
>;

type CustomerRollbackSnapshot = Pick<
  Tables<"customers">,
  "last_inquiry_at" | "last_order_at"
>;

type OrderCreationRollbackContext = {
  createdCustomerId: string | null;
  customerId: string;
  customerSnapshot: CustomerRollbackSnapshot | null;
  inquirySnapshot: InquiryRollbackSnapshot;
  orderId: string;
};

type OrderQuickActionResult =
  | {
      ok: true;
      message: string;
      undo?:
        | {
            orderId: string;
            paymentId: string;
            type: "payment";
          }
        | {
            completedAt: string | null;
            orderId: string;
            previousStatus: Enums<"order_status">;
            type: "status";
          };
    }
  | {
      ok: false;
      message: string;
    };

function getSafeOrderRedirectTarget(value: FormDataEntryValue | null, orderId?: string) {
  return getSafeRedirectTarget(
    value,
    "/admin/orders",
    orderId ? `/admin/orders/${orderId}` : "/admin/orders",
  );
}

function getSafeInquiryRedirectTarget(value: FormDataEntryValue | null, inquiryId?: string) {
  return getSafeRedirectTarget(
    value,
    "/admin/inquiries",
    inquiryId ? `/admin/inquiries/${inquiryId}` : "/admin/inquiries",
  );
}

function getStatusTransitionPatch(
  nextStatus: Enums<"order_status">,
  currentRow: OrderStatusTransitionRow,
): TablesUpdate<"orders"> {
  const now = new Date().toISOString();
  const update: TablesUpdate<"orders"> = {};

  if (nextStatus === "quoted" && !currentRow.quoted_at) {
    update.quoted_at = now;
  }

  if (nextStatus === "confirmed" && !currentRow.confirmed_at) {
    update.confirmed_at = now;
  }

  if (nextStatus === "fulfilled" && !currentRow.fulfilled_at) {
    update.fulfilled_at = now;
  }

  if (nextStatus === "completed" && !currentRow.completed_at) {
    update.completed_at = now;
  }

  if (nextStatus === "cancelled" && !currentRow.cancelled_at) {
    update.cancelled_at = now;
  }

  return update;
}

async function syncOrderPaymentState(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, total_amount, deposit_due_amount, payments(amount, payment_type, status)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Order could not be reloaded.");
  }

  const snapshot = calculateOrderPaymentSnapshot(data, data.payments ?? []);
  const update: TablesUpdate<"orders"> = {
    balance_due_amount: snapshot.balanceDue,
    payment_status: snapshot.paymentStatus,
  };

  const { error: updateError } = await supabase.from("orders").update(update).eq("id", orderId);

  if (updateError) {
    throw updateError;
  }

  return snapshot;
}

function revalidateOrderWorkflow(orderId: string, customerId?: string | null, inquiryId?: string | null) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/customers");

  if (customerId) {
    revalidatePath(`/admin/customers/${customerId}`);
  }

  revalidatePath("/admin/inquiries");

  if (inquiryId) {
    revalidatePath(`/admin/inquiries/${inquiryId}`);
  }
}

async function rollbackCreatedOrder(
  supabase: ReturnType<typeof createAdminClient>,
  context: OrderCreationRollbackContext,
) {
  const logRollbackError = (step: string, error: unknown) => {
    if (error) {
      console.error(`Order conversion rollback step failed (${step}).`, error);
    }
  };

  const { error: paymentsError } = await supabase
    .from("payments")
    .delete()
    .eq("order_id", context.orderId);
  logRollbackError("payments", paymentsError);

  const { error: itemsError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", context.orderId);
  logRollbackError("order_items", itemsError);

  const { error: orderError } = await supabase
    .from("orders")
    .delete()
    .eq("id", context.orderId);
  logRollbackError("orders", orderError);

  const { error: inquiryError } = await supabase
    .from("inquiries")
    .update({
      customer_id: context.inquirySnapshot.customer_id,
      reviewed_at: context.inquirySnapshot.reviewed_at,
      status: context.inquirySnapshot.status,
    })
    .eq("id", context.inquirySnapshot.id);
  logRollbackError("inquiries", inquiryError);

  if (context.createdCustomerId) {
    const { error: customerDeleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", context.createdCustomerId);
    logRollbackError("customers delete", customerDeleteError);
    return;
  }

  if (context.customerSnapshot) {
    const { error: customerRestoreError } = await supabase
      .from("customers")
      .update({
        last_inquiry_at: context.customerSnapshot.last_inquiry_at,
        last_order_at: context.customerSnapshot.last_order_at,
      })
      .eq("id", context.customerId);
    logRollbackError("customers restore", customerRestoreError);
  }
}

export async function createManualOrder(formData: FormData) {
  await requireAdmin();

  const variant = parseRequiredString(formData.get("variant"));
  const isQuickAdd = variant === "quick";
  const customerName = parseRequiredString(formData.get("customerName"));
  const customerEmail = parseOptionalString(formData.get("customerEmail"));
  const customerPhone = parseOptionalString(formData.get("customerPhone"));
  const eventType = parseRequiredString(formData.get("eventType"));
  const eventDate = parseRequiredString(formData.get("eventDate"));
  const fulfillmentMethod = parseRequiredString(formData.get("fulfillmentMethod"));
  const productId = parseOptionalString(formData.get("productId"));
  const fallbackProductType = parseRequiredString(formData.get("fallbackProductType"));
  const itemDescription = parseOptionalString(formData.get("itemDescription"));
  const paymentAmounts = validateManualOrderPaymentAmounts({
    amountPaid: formData.get("amountPaid"),
    depositDueAmount: formData.get("depositDueAmount"),
    totalAmount: formData.get("totalAmount"),
  });
  const internalSummary = parseOptionalString(formData.get("internalSummary"));
  const errorPath = isQuickAdd ? "/admin/orders/new?mode=quick" : "/admin/orders/new";

  if (
    !customerName ||
    !eventType ||
    !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    !paymentAmounts.ok ||
    (isQuickAdd && !itemDescription) ||
    (!isQuickAdd && !productId)
  ) {
    redirectWithNotice(errorPath, paymentAmounts.ok ? "manual-order-error" : "manual-order-amount-error");
  }

  const { amountPaid, depositDueAmount, totalAmount } = paymentAmounts;

  if (
    !Constants.public.Enums.fulfillment_method.includes(
      fulfillmentMethod as Enums<"fulfillment_method">,
    )
  ) {
    redirectWithNotice(errorPath, "manual-order-error");
  }

  if (
    isQuickAdd &&
    !Constants.public.Enums.product_type.includes(fallbackProductType as Enums<"product_type">)
  ) {
    redirectWithNotice(errorPath, "manual-order-error");
  }

  const supabase = createAdminClient();
  const { data: product, error: productError } = isQuickAdd
    ? { data: null, error: null }
    : await supabase
        .from("products")
        .select("id, name, product_type")
        .eq("id", productId ?? "")
        .maybeSingle();

  if (!isQuickAdd && (productError || !product)) {
    redirectWithNotice(errorPath, "manual-order-error");
  }

  const { data: existingCustomer } = customerEmail
    ? await supabase
        .from("customers")
        .select("id, last_order_at")
        .eq("email", customerEmail)
        .maybeSingle()
    : { data: null };

  let customer: { id: string };
  let createdCustomerId: string | null = null;
  let previousLastOrderAt: string | null = null;

  if (existingCustomer) {
    previousLastOrderAt = existingCustomer.last_order_at;
    customer = { id: existingCustomer.id };

    const { error: customerTouchError } = await supabase
      .from("customers")
      .update({ last_order_at: new Date().toISOString() })
      .eq("id", existingCustomer.id);

    if (customerTouchError) {
      redirectWithNotice(errorPath, "manual-order-error");
    }
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        email: customerEmail,
        full_name: customerName,
        last_order_at: new Date().toISOString(),
        phone: customerPhone,
        preferred_contact: customerPhone ? "text" : "email",
      } satisfies TablesInsert<"customers">)
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      redirectWithNotice(errorPath, "manual-order-error");
    }

    customer = newCustomer;
    createdCustomerId = newCustomer.id;
  }

  async function rollbackManualOrderCustomer() {
    if (createdCustomerId) {
      const { error } = await supabase.from("customers").delete().eq("id", createdCustomerId);

      if (error) {
        console.error("Unable to roll back manual-order customer insert.", error);
      }

      return;
    }

    const { error } = await supabase
      .from("customers")
      .update({ last_order_at: previousLastOrderAt })
      .eq("id", customer.id);

    if (error) {
      console.error("Unable to restore customer after manual-order failure.", error);
    }
  }

  const statusTimestamps = getStatusTransitionPatch("confirmed", {
    cancelled_at: null,
    completed_at: null,
    confirmed_at: null,
    fulfilled_at: null,
    quoted_at: null,
  });

  const orderInsert: TablesInsert<"orders"> = {
    balance_due_amount: totalAmount,
    customer_id: customer.id,
    deposit_due_amount: depositDueAmount,
    event_date: eventDate,
    event_type: eventType,
    fulfillment_method: fulfillmentMethod as Enums<"fulfillment_method">,
    internal_summary: internalSummary,
    payment_status: "unpaid",
    status: "confirmed",
    subtotal_amount: totalAmount,
    total_amount: totalAmount,
    ...statusTimestamps,
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderInsert)
    .select("id, customer_id")
    .single();

  if (orderError || !order) {
    await rollbackManualOrderCustomer();
    redirectWithNotice(errorPath, "manual-order-error");
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    line_total: totalAmount,
    order_id: order.id,
    product_id: isQuickAdd ? null : product?.id,
    product_label: itemDescription ?? product?.name ?? "Custom item",
    product_type: (isQuickAdd ? fallbackProductType : product?.product_type) as Enums<"product_type">,
    quantity: 1,
    sort_order: 10,
    unit_price: totalAmount,
  } satisfies TablesInsert<"order_items">);

  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    await rollbackManualOrderCustomer();
    redirectWithNotice(errorPath, "manual-order-error");
  }

  if (amountPaid > 0) {
    const paymentInsert: TablesInsert<"payments"> = {
      amount: amountPaid,
      customer_id: customer.id,
      method: "other",
      notes: isQuickAdd ? "Recorded during quick add." : "Recorded during manual order creation.",
      order_id: order.id,
      paid_at: new Date().toISOString(),
      payment_type: amountPaid >= totalAmount ? "full" : "deposit",
      status: "paid",
    };

    const { error: paymentError } = await supabase.from("payments").insert(paymentInsert);

    if (paymentError) {
      await supabase.from("order_items").delete().eq("order_id", order.id);
      await supabase.from("orders").delete().eq("id", order.id);
      await rollbackManualOrderCustomer();
      redirectWithNotice(errorPath, "manual-order-error");
    }
  }

  await syncOrderPaymentState(order.id);
  revalidateOrderWorkflow(order.id, order.customer_id, null);
  redirectWithNotice(`/admin/orders/${order.id}`, "manual-order-created");
}

export async function markOrderPaidQuickAction(input: {
  orderId: string;
}): Promise<OrderQuickActionResult> {
  await requireAdmin();

  const orderId = input.orderId;

  if (!orderId) {
    return { ok: false, message: "Order could not be found." };
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_id, inquiry_id, total_amount, deposit_due_amount, payments(amount, payment_type, status)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return { ok: false, message: "Order could not be found." };
  }

  const snapshot = calculateOrderPaymentSnapshot(order, order.payments ?? []);

  if (snapshot.balanceDue <= 0) {
    return { ok: true, message: "Order is already marked paid." };
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      amount: snapshot.balanceDue,
      customer_id: order.customer_id,
      method: "other",
      notes: "Marked paid from the orders list.",
      order_id: order.id,
      paid_at: new Date().toISOString(),
      payment_type: snapshot.totalPaid > 0 ? "balance" : "full",
      status: "paid",
    } satisfies TablesInsert<"payments">)
    .select("id")
    .single();

  if (paymentError || !payment) {
    return { ok: false, message: "Payment could not be recorded." };
  }

  await syncOrderPaymentState(order.id);
  revalidateOrderWorkflow(order.id, order.customer_id, order.inquiry_id);

  return {
    ok: true,
    message: "Order marked paid.",
    undo: {
      orderId: order.id,
      paymentId: payment.id,
      type: "payment",
    },
  };
}

export async function undoMarkOrderPaidQuickAction(input: {
  orderId: string;
  paymentId: string;
}): Promise<OrderQuickActionResult> {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id, inquiry_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { ok: false, message: "Order could not be found." };
  }

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", input.paymentId)
    .eq("order_id", input.orderId);

  if (error) {
    return { ok: false, message: "Undo could not be completed." };
  }

  await syncOrderPaymentState(order.id);
  revalidateOrderWorkflow(order.id, order.customer_id, order.inquiry_id);

  return { ok: true, message: "Payment mark undone." };
}

export async function markOrderCompletedQuickAction(input: {
  orderId: string;
}): Promise<OrderQuickActionResult> {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_id, inquiry_id, status, completed_at")
    .eq("id", input.orderId)
    .maybeSingle();

  if (error || !order) {
    return { ok: false, message: "Order could not be found." };
  }

  if (order.status === "completed") {
    return { ok: true, message: "Order is already completed." };
  }

  if (order.status === "cancelled") {
    return { ok: false, message: "Cancelled orders cannot be completed from the list." };
  }

  const previousStatus = order.status;
  const completedAt = order.completed_at;
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      completed_at: completedAt ?? new Date().toISOString(),
      status: "completed",
    } satisfies TablesUpdate<"orders">)
    .eq("id", order.id);

  if (updateError) {
    return { ok: false, message: "Order could not be completed." };
  }

  revalidateOrderWorkflow(order.id, order.customer_id, order.inquiry_id);

  return {
    ok: true,
    message: "Order marked completed.",
    undo: {
      completedAt,
      orderId: order.id,
      previousStatus,
      type: "status",
    },
  };
}

export async function undoMarkOrderCompletedQuickAction(input: {
  completedAt: string | null;
  orderId: string;
  previousStatus: Enums<"order_status">;
}): Promise<OrderQuickActionResult> {
  await requireAdmin();

  if (!Constants.public.Enums.order_status.includes(input.previousStatus)) {
    return { ok: false, message: "Undo could not be completed." };
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id, inquiry_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { ok: false, message: "Order could not be found." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      completed_at: input.completedAt,
      status: input.previousStatus,
    } satisfies TablesUpdate<"orders">)
    .eq("id", input.orderId);

  if (error) {
    return { ok: false, message: "Undo could not be completed." };
  }

  revalidateOrderWorkflow(order.id, order.customer_id, order.inquiry_id);

  return { ok: true, message: "Completion mark undone." };
}

export async function createOrderFromInquiry(formData: FormData) {
  await requireAdmin();

  const inquiryId = parseRequiredString(formData.get("inquiryId"));
  const redirectTarget = getSafeInquiryRedirectTarget(formData.get("redirectTo"), inquiryId);
  const customerAction = parseRequiredString(formData.get("customerAction"));
  const existingCustomerId = parseOptionalString(formData.get("existingCustomerId"));
  const orderStatus = parseRequiredString(formData.get("orderStatus"));
  const estimatedTotalAmount = parseAmount(formData.get("estimatedTotalAmount"));
  const totalAmount = parseAmount(formData.get("totalAmount")) ?? 0;
  const depositDueAmount = parseAmount(formData.get("depositDueAmount")) ?? 0;
  const depositDueAt = parseDateInputAsIso(formData.get("depositDueAt"));
  const finalDueAt = parseDateInputAsIso(formData.get("finalDueAt"));
  const internalSummary = parseOptionalString(formData.get("internalSummary"));
  const fulfillmentNotes = parseOptionalString(formData.get("fulfillmentNotes"));

  if (!inquiryId) {
    redirectWithNotice("/admin/inquiries", "convert-error");
  }

  if (!Constants.public.Enums.order_status.includes(orderStatus as Enums<"order_status">)) {
    redirectWithNotice(redirectTarget, "convert-error");
  }

  const nextOrderStatus = orderStatus as Enums<"order_status">;

  const supabase = createAdminClient();
  const inquiryPromise = supabase
    .from("inquiries")
    .select(
      "id, customer_id, customer_name, customer_email, customer_phone, instagram_handle, preferred_contact, how_did_you_hear, event_type, event_date, fulfillment_method, delivery_window, venue_name, venue_address, reviewed_at, status, submitted_at",
    )
    .eq("id", inquiryId)
    .maybeSingle();
  const itemsPromise = supabase
    .from("inquiry_items")
    .select(
      "id, product_id, product_type, product_label, quantity, sort_order, servings, size_label, tiers, shape, icing_style, cupcake_count, cookie_count, macaron_count, kit_count, wedding_servings, flavor_notes, design_notes, topper_text, color_palette, detail_json",
    )
    .eq("inquiry_id", inquiryId)
    .order("sort_order", { ascending: true });
  const existingOrderPromise = supabase
    .from("orders")
    .select("id")
    .eq("inquiry_id", inquiryId)
    .maybeSingle();

  const [
    { data: inquiry, error: inquiryError },
    { data: inquiryItems, error: itemsError },
    { data: existingOrder, error: existingOrderError },
  ] = await Promise.all([inquiryPromise, itemsPromise, existingOrderPromise]);

  if (inquiryError || !inquiry) {
    redirectWithNotice(redirectTarget, "convert-error");
  }

  if (itemsError || !inquiryItems || inquiryItems.length === 0) {
    redirectWithNotice(redirectTarget, "convert-error");
  }

  if (existingOrderError) {
    redirectWithNotice(redirectTarget, "convert-error");
  }

  if (existingOrder?.id) {
    redirectWithNotice(`/admin/orders/${existingOrder.id}`, "order-exists");
  }

  let customerId = inquiry.customer_id;
  let createdCustomerId: string | null = null;
  let usedExistingCustomerMatch = false;

  if (customerAction === "link") {
    if (!existingCustomerId) {
      redirectWithNotice(redirectTarget, "convert-error");
    }

    customerId = existingCustomerId;
  } else if (!customerId) {
    const { data: existingCustomerByEmail } = inquiry.customer_email
      ? await supabase
          .from("customers")
          .select("id")
          .eq("email", inquiry.customer_email)
          .maybeSingle()
      : { data: null };

    if (existingCustomerByEmail?.id) {
      customerId = existingCustomerByEmail.id;
      usedExistingCustomerMatch = true;
    } else {
      const customerInsert: TablesInsert<"customers"> = {
        email: inquiry.customer_email,
        full_name: inquiry.customer_name,
        instagram_handle: inquiry.instagram_handle,
        lead_source: inquiry.how_did_you_hear,
        phone: inquiry.customer_phone,
        preferred_contact: inquiry.preferred_contact,
      };

      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert(customerInsert)
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        redirectWithNotice(redirectTarget, "convert-error");
      }

      customerId = newCustomer.id;
      createdCustomerId = newCustomer.id;
    }
  }

  if (!customerId) {
    redirectWithNotice(redirectTarget, "convert-error");
  }

  let customerSnapshot: CustomerRollbackSnapshot | null = null;

  if (!createdCustomerId) {
    const { data: currentCustomer, error: customerSnapshotError } = await supabase
      .from("customers")
      .select("last_inquiry_at, last_order_at")
      .eq("id", customerId)
      .maybeSingle();

    if (customerSnapshotError || !currentCustomer) {
      redirectWithNotice(redirectTarget, "convert-error");
    }

    customerSnapshot = currentCustomer;
  }

  const metadata = mergeOrderWorkflowMetadata({}, {
    estimatedTotalAmount,
    fulfillmentNotes,
  });

  const orderInsert: TablesInsert<"orders"> = {
    balance_due_amount: totalAmount,
    customer_id: customerId,
    delivery_address: inquiry.fulfillment_method === "delivery" ? inquiry.venue_address : null,
    deposit_due_amount: depositDueAmount,
    deposit_due_at: depositDueAt,
    due_at: finalDueAt ?? depositDueAt,
    event_date: inquiry.event_date,
    event_type: inquiry.event_type,
    final_due_at: finalDueAt,
    fulfillment_method: inquiry.fulfillment_method,
    fulfillment_window: inquiry.delivery_window,
    inquiry_id: inquiry.id,
    internal_summary: internalSummary,
    metadata,
    payment_status: "unpaid",
    status: nextOrderStatus,
    subtotal_amount: totalAmount,
    total_amount: totalAmount,
    venue_address: inquiry.venue_address,
    venue_name: inquiry.venue_name,
  };

  const statusTimestamps = getStatusTransitionPatch(nextOrderStatus, {
    cancelled_at: null,
    completed_at: null,
    confirmed_at: null,
    fulfilled_at: null,
    quoted_at: null,
  });

  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert({ ...orderInsert, ...statusTimestamps })
    .select("id, customer_id, inquiry_id")
    .single();

  if (orderError || !createdOrder) {
    redirectWithNotice(redirectTarget, "convert-error");
  }

  const orderItemsInsert: TablesInsert<"order_items">[] = inquiryItems.map((item) => ({
    color_palette: item.color_palette,
    cookie_count: item.cookie_count,
    cupcake_count: item.cupcake_count,
    design_notes: item.design_notes,
    detail_json: item.detail_json,
    flavor_notes: item.flavor_notes,
    icing_style: item.icing_style,
    inquiry_item_id: item.id,
    kit_count: item.kit_count,
    macaron_count: item.macaron_count,
    order_id: createdOrder.id,
    product_id: item.product_id,
    product_label: item.product_label,
    product_type: item.product_type,
    quantity: item.quantity,
    servings: item.servings,
    shape: item.shape,
    size_label: item.size_label,
    sort_order: item.sort_order,
    tiers: item.tiers,
    topper_text: item.topper_text,
    wedding_servings: item.wedding_servings,
  }));

  const { error: orderItemsError } = await supabase.from("order_items").insert(orderItemsInsert);

  if (orderItemsError) {
    await rollbackCreatedOrder(supabase, {
      createdCustomerId,
      customerId,
      customerSnapshot,
      inquirySnapshot: inquiry,
      orderId: createdOrder.id,
    });
    redirectWithNotice(redirectTarget, "convert-error");
  }

  if (depositDueAmount > 0) {
    const depositPaymentInsert: TablesInsert<"payments"> = {
      amount: depositDueAmount,
      customer_id: customerId,
      due_at: depositDueAt,
      method: "invoice",
      order_id: createdOrder.id,
      payment_type: "deposit",
      status: "pending",
    };

    const { error: depositPaymentError } = await supabase
      .from("payments")
      .insert(depositPaymentInsert);

    if (depositPaymentError) {
      await rollbackCreatedOrder(supabase, {
        createdCustomerId,
        customerId,
        customerSnapshot,
        inquirySnapshot: inquiry,
        orderId: createdOrder.id,
      });
      redirectWithNotice(redirectTarget, "convert-error");
    }
  }

  const [{ error: inquiryUpdateError }, { error: customerUpdateError }] = await Promise.all([
    supabase
      .from("inquiries")
      .update({
        customer_id: customerId,
        reviewed_at: inquiry.reviewed_at ?? new Date().toISOString(),
        status: "approved",
      })
      .eq("id", inquiry.id),
    supabase
      .from("customers")
      .update({
        last_inquiry_at: inquiry.submitted_at,
        last_order_at: new Date().toISOString(),
      })
      .eq("id", customerId),
  ]);

  if (inquiryUpdateError || customerUpdateError) {
    await rollbackCreatedOrder(supabase, {
      createdCustomerId,
      customerId,
      customerSnapshot,
      inquirySnapshot: inquiry,
      orderId: createdOrder.id,
    });
    redirectWithNotice(redirectTarget, "convert-error");
  }

  try {
    await syncOrderPaymentState(createdOrder.id);
  } catch (error) {
    console.error("Unable to finalize order payment state after inquiry conversion.", error);
    await rollbackCreatedOrder(supabase, {
      createdCustomerId,
      customerId,
      customerSnapshot,
      inquirySnapshot: inquiry,
      orderId: createdOrder.id,
    });
    redirectWithNotice(redirectTarget, "convert-error");
  }

  revalidateOrderWorkflow(createdOrder.id, createdOrder.customer_id, createdOrder.inquiry_id);

  redirectWithNotice(
    `/admin/orders/${createdOrder.id}`,
    usedExistingCustomerMatch ? "order-created-linked" : "order-created",
  );
}

export async function updateOrderDetails(formData: FormData) {
  await requireAdmin();

  const orderId = parseRequiredString(formData.get("orderId"));
  const redirectTarget = getSafeOrderRedirectTarget(formData.get("redirectTo"), orderId);
  const nextStatus = parseRequiredString(formData.get("status"));
  const eventType = parseRequiredString(formData.get("eventType"));
  const eventDate = parseRequiredString(formData.get("eventDate"));
  const fulfillmentMethod = parseRequiredString(formData.get("fulfillmentMethod"));
  const venueName = parseOptionalString(formData.get("venueName"));
  const venueAddress = parseOptionalString(formData.get("venueAddress"));
  const fulfillmentWindow = parseOptionalString(formData.get("fulfillmentWindow"));
  const deliveryAddress = parseOptionalString(formData.get("deliveryAddress"));
  const subtotalAmount = parseAmount(formData.get("subtotalAmount"));
  const discountAmount = parseAmount(formData.get("discountAmount")) ?? 0;
  const deliveryFee = parseAmount(formData.get("deliveryFee")) ?? 0;
  const taxAmount = parseAmount(formData.get("taxAmount")) ?? 0;
  const totalAmount = parseAmount(formData.get("totalAmount")) ?? 0;
  const depositDueAmount = parseAmount(formData.get("depositDueAmount")) ?? 0;
  const depositDueAt = parseDateInputAsIso(formData.get("depositDueAt"));
  const finalDueAt = parseDateInputAsIso(formData.get("finalDueAt"));
  const internalSummary = parseOptionalString(formData.get("internalSummary"));
  const productionNotes = parseOptionalString(formData.get("productionNotes"));
  const estimatedTotalAmount = parseAmount(formData.get("estimatedTotalAmount"));
  const workflowDesignNotes = parseOptionalString(formData.get("workflowDesignNotes"));
  const squareInvoiceNumber = parseOptionalString(formData.get("squareInvoiceNumber"));
  const squareInvoiceUrl = parseOptionalString(formData.get("squareInvoiceUrl"));
  const squareInvoiceStatus = parseOptionalString(formData.get("squareInvoiceStatus"));
  const fulfillmentNotes = parseOptionalString(formData.get("fulfillmentNotes"));

  if (!orderId || !eventType || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    redirectWithNotice(redirectTarget, "order-error");
  }

  if (
    !Constants.public.Enums.order_status.includes(nextStatus as Enums<"order_status">) ||
    !Constants.public.Enums.fulfillment_method.includes(
      fulfillmentMethod as Enums<"fulfillment_method">,
    )
  ) {
    redirectWithNotice(redirectTarget, "order-error");
  }

  const supabase = createAdminClient();
  const { data: currentOrder, error: currentOrderError } = await supabase
    .from("orders")
    .select(
      "id, customer_id, inquiry_id, metadata, quoted_at, confirmed_at, fulfilled_at, completed_at, cancelled_at",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (currentOrderError || !currentOrder) {
    redirectWithNotice(redirectTarget, "order-error");
  }

  const metadata = mergeOrderWorkflowMetadata(currentOrder.metadata, {
    designNotes: workflowDesignNotes,
    estimatedTotalAmount,
    fulfillmentNotes,
    squareInvoiceNumber,
    squareInvoiceStatus,
    squareInvoiceUrl,
  });

  const derivedSubtotal = Math.max(totalAmount - deliveryFee - taxAmount + discountAmount, 0);
  const update: TablesUpdate<"orders"> = {
    delivery_address:
      fulfillmentMethod === "delivery" ? deliveryAddress ?? venueAddress : null,
    delivery_fee: deliveryFee,
    deposit_due_amount: depositDueAmount,
    deposit_due_at: depositDueAt,
    discount_amount: discountAmount,
    due_at: finalDueAt ?? depositDueAt,
    event_date: eventDate,
    event_type: eventType,
    final_due_at: finalDueAt,
    fulfillment_method: fulfillmentMethod as Enums<"fulfillment_method">,
    fulfillment_window: fulfillmentWindow,
    internal_summary: internalSummary,
    metadata,
    production_notes: productionNotes,
    status: nextStatus as Enums<"order_status">,
    subtotal_amount: subtotalAmount ?? derivedSubtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    venue_address: venueAddress,
    venue_name: venueName,
    ...getStatusTransitionPatch(nextStatus as Enums<"order_status">, currentOrder),
  };

  const { error: updateError } = await supabase.from("orders").update(update).eq("id", orderId);

  if (updateError) {
    redirectWithNotice(redirectTarget, "order-error");
  }

  await syncOrderPaymentState(orderId);
  revalidateOrderWorkflow(orderId, currentOrder.customer_id, currentOrder.inquiry_id);
  redirectWithNotice(redirectTarget, "order-updated");
}

export async function addOrderPayment(formData: FormData) {
  await requireAdmin();

  const orderId = parseRequiredString(formData.get("orderId"));
  const redirectTarget = getSafeOrderRedirectTarget(formData.get("redirectTo"), orderId);
  const paymentUiType = parseRequiredString(formData.get("paymentUiType"));
  const amount = parseAmount(formData.get("amount"));
  const status = parseRequiredString(formData.get("status"));
  const method = parseRequiredString(formData.get("method"));
  const dueAt = parseDateInputAsIso(formData.get("dueAt"));
  const paidAt = parseDateInputAsIso(formData.get("paidAt"));
  const referenceCode = parseOptionalString(formData.get("referenceCode"));
  const providerName = parseOptionalString(formData.get("providerName"));
  const providerIntentId = parseOptionalString(formData.get("providerIntentId"));
  const notes = parseOptionalString(formData.get("notes"));

  if (!orderId || amount === null || amount <= 0) {
    redirectWithNotice(redirectTarget, "payment-error");
  }

  const storedPaymentType = getStoredPaymentType(paymentUiType);

  if (
    !storedPaymentType ||
    !Constants.public.Enums.payment_record_status.includes(
      status as Enums<"payment_record_status">,
    ) ||
    !Constants.public.Enums.payment_method.includes(method as Enums<"payment_method">)
  ) {
    redirectWithNotice(redirectTarget, "payment-error");
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id, inquiry_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    redirectWithNotice(redirectTarget, "payment-error");
  }

  const paymentInsert: TablesInsert<"payments"> = {
    amount,
    customer_id: order.customer_id,
    due_at: dueAt,
    method: method as Enums<"payment_method">,
    notes,
    order_id: orderId,
    paid_at: status === "paid" ? paidAt ?? new Date().toISOString() : paidAt,
    payment_type: storedPaymentType,
    provider_intent_id: providerIntentId,
    provider_name: providerName,
    reference_code: referenceCode,
    status: status as Enums<"payment_record_status">,
  };

  const { error: paymentError } = await supabase.from("payments").insert(paymentInsert);

  if (paymentError) {
    redirectWithNotice(redirectTarget, "payment-error");
  }

  await syncOrderPaymentState(orderId);
  revalidateOrderWorkflow(orderId, order.customer_id, order.inquiry_id);
  redirectWithNotice(redirectTarget, "payment-added");
}

export async function updateOrderPayment(formData: FormData) {
  await requireAdmin();

  const orderId = parseRequiredString(formData.get("orderId"));
  const paymentId = parseRequiredString(formData.get("paymentId"));
  const redirectTarget = getSafeOrderRedirectTarget(formData.get("redirectTo"), orderId);
  const paymentUiType = parseRequiredString(formData.get("paymentUiType"));
  const amount = parseAmount(formData.get("amount"));
  const status = parseRequiredString(formData.get("status"));
  const method = parseRequiredString(formData.get("method"));
  const dueAt = parseDateInputAsIso(formData.get("dueAt"));
  const paidAt = parseDateInputAsIso(formData.get("paidAt"));
  const referenceCode = parseOptionalString(formData.get("referenceCode"));
  const providerName = parseOptionalString(formData.get("providerName"));
  const providerIntentId = parseOptionalString(formData.get("providerIntentId"));
  const notes = parseOptionalString(formData.get("notes"));

  if (!orderId || !paymentId || amount === null || amount <= 0) {
    redirectWithNotice(redirectTarget, "payment-error");
  }

  const storedPaymentType = getStoredPaymentType(paymentUiType);

  if (
    !storedPaymentType ||
    !Constants.public.Enums.payment_record_status.includes(
      status as Enums<"payment_record_status">,
    ) ||
    !Constants.public.Enums.payment_method.includes(method as Enums<"payment_method">)
  ) {
    redirectWithNotice(redirectTarget, "payment-error");
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id, inquiry_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    redirectWithNotice(redirectTarget, "payment-error");
  }

  const paymentUpdate: TablesUpdate<"payments"> = {
    amount,
    due_at: dueAt,
    method: method as Enums<"payment_method">,
    notes,
    paid_at: status === "paid" ? paidAt ?? new Date().toISOString() : paidAt,
    payment_type: storedPaymentType,
    provider_intent_id: providerIntentId,
    provider_name: providerName,
    reference_code: referenceCode,
    status: status as Enums<"payment_record_status">,
  };

  const { error: paymentError } = await supabase
    .from("payments")
    .update(paymentUpdate)
    .eq("id", paymentId)
    .eq("order_id", orderId);

  if (paymentError) {
    redirectWithNotice(redirectTarget, "payment-error");
  }

  await syncOrderPaymentState(orderId);
  revalidateOrderWorkflow(orderId, order.customer_id, order.inquiry_id);
  redirectWithNotice(redirectTarget, "payment-updated");
}

export async function addOrderNote(formData: FormData) {
  const admin = await requireAdmin();

  const orderId = parseRequiredString(formData.get("orderId"));
  const redirectTarget = getSafeOrderRedirectTarget(formData.get("redirectTo"), orderId);
  const noteBody = parseOptionalString(formData.get("noteBody"));
  const isPinned = formData.get("isPinned") === "on";

  if (!orderId || !noteBody) {
    redirectWithNotice(redirectTarget, "note-error");
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id, inquiry_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    redirectWithNotice(redirectTarget, "note-error");
  }

  const noteInsert: TablesInsert<"order_notes"> = {
    author_profile_id: admin.id,
    is_pinned: isPinned,
    note_body: noteBody,
    note_type: "internal",
    order_id: orderId,
  };

  const { error: noteError } = await supabase.from("order_notes").insert(noteInsert);

  if (noteError) {
    redirectWithNotice(redirectTarget, "note-error");
  }

  revalidateOrderWorkflow(orderId, order.customer_id, order.inquiry_id);
  redirectWithNotice(redirectTarget, "note-added");
}

export async function deleteOrder(formData: FormData) {
  const admin = await requireAdmin();

  const orderId = parseRequiredString(formData.get("orderId"));
  const redirectTarget = getSafeOrderRedirectTarget(formData.get("redirectTo"), orderId);

  if (!canDeleteOrder(admin) || !orderId) {
    redirectWithNotice(redirectTarget, "order-delete-error");
  }

  const result = await deleteOrderRecord(createAdminClient() as unknown as OrderDeleteClient, orderId);

  if (!result.ok) {
    console.error("Unable to delete order.", {
      diagnostic: result.diagnostic,
      orderId,
      reason: result.reason,
    });
    redirectWithNotice(redirectTarget, "order-delete-error");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/customers");

  if (result.customerId) {
    revalidatePath(`/admin/customers/${result.customerId}`);
  }

  revalidatePath("/admin/inquiries");

  if (result.inquiryId) {
    revalidatePath(`/admin/inquiries/${result.inquiryId}`);
  }

  redirectWithNotice("/admin/orders", "order-deleted");
}
