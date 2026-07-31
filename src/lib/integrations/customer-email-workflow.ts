import "server-only";

import { getBusinessDateKey } from "@/lib/business-time";
import { getIntegrationConfig } from "@/lib/integrations/config";
import {
  getIntegrationConnection,
  markIntegrationFailure,
  markIntegrationSuccess,
} from "@/lib/integrations/repository";
import { ResendIntegrationError, sendResendEmail } from "@/lib/integrations/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert } from "@/types/supabase.generated";

type CustomerEmailKind = "booking" | "fulfillment" | "review";

type EmailOrder = {
  completed_at: string | null;
  confirmed_at: string | null;
  customer_id: string;
  customers: { email: string | null; full_name: string } | null;
  event_date: string;
  event_type: string;
  fulfillment_method: string;
  fulfillment_window: string | null;
  id: string;
  metadata: Json;
  status: string;
};

const eventKeys: Record<CustomerEmailKind, string> = {
  booking: "order.booking-confirmed",
  fulfillment: "order.fulfillment-reminder",
  review: "order.review-request",
};

function record(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function emailContent(kind: CustomerEmailKind, order: EmailOrder) {
  const customerName = firstName(order.customers?.full_name ?? "");
  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "America/Denver",
  }).format(new Date(`${order.event_date}T12:00:00-06:00`));
  const fulfillment = order.fulfillment_method === "delivery" ? "delivery" : "pickup";
  const window = order.fulfillment_window ? ` Your current ${fulfillment} window is ${order.fulfillment_window}.` : "";
  const reviewUrl = getIntegrationConfig().resend.reviewUrl;

  if (kind === "booking") {
    const subject = `Your Sweet Fork order is reserved · ${date}`;
    const text = `Hi ${customerName},\n\nYour deposit has been received and your ${order.event_type} order is reserved for ${date}. I’ll be in touch as the date approaches with any final ${fulfillment} details.\n\nThe Sweet Fork`;
    return { subject, text };
  }
  if (kind === "fulfillment") {
    const subject = `Your Sweet Fork ${fulfillment} is coming up`;
    const text = `Hi ${customerName},\n\nA quick reminder that your ${order.event_type} order is scheduled for ${date}.${window}\n\nIf any final handoff detail has changed, please reply directly.\n\nThe Sweet Fork`;
    return { subject, text };
  }

  const subject = "Thank you for choosing The Sweet Fork";
  const reviewLine = reviewUrl ? `\n\nIf you have a moment, I’d be grateful for a Google review: ${reviewUrl}` : "";
  const text = `Hi ${customerName},\n\nThank you for trusting The Sweet Fork with your celebration. I hope the order was a beautiful part of the day.${reviewLine}\n\nMelissa\nThe Sweet Fork`;
  return { subject, text };
}

function textToHtml(text: string) {
  return `<div style="background:#f8f4ec;padding:32px 18px;color:#302a26;font-family:Georgia,serif"><div style="max-width:620px;margin:0 auto;background:#fff;padding:32px;border-radius:24px;border:1px solid #e8dfd2"><div style="font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#9a7b45">The Sweet Fork</div><div style="margin-top:24px;white-space:pre-line;font-family:Arial,sans-serif;font-size:16px;line-height:1.7">${escapeHtml(text)}</div></div></div>`;
}

async function assertResendReady() {
  const config = getIntegrationConfig().resend;
  const connection = await getIntegrationConnection("resend");
  if (!config.enabled || !connection?.enabled || connection.status === "disabled") {
    throw new ResendIntegrationError("resend-disabled");
  }
}

export async function sendOrderLifecycleEmail(orderId: string, kind: CustomerEmailKind) {
  await assertResendReady();
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_id, status, event_type, event_date, fulfillment_method, fulfillment_window, confirmed_at, completed_at, metadata, customers(full_name, email)")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) throw new ResendIntegrationError("email-order-not-found");
  const typedOrder = order as EmailOrder;
  if (!typedOrder.customers?.email) throw new ResendIntegrationError("email-recipient-missing");
  if (kind === "fulfillment" && record(typedOrder.metadata).suppressFulfillmentReminder === true) {
    return { skipped: true };
  }

  const { data: event, error: eventError } = await supabase
    .from("notification_events")
    .select("id")
    .eq("event_key", eventKeys[kind])
    .eq("is_active", true)
    .maybeSingle();
  if (eventError || !event) return { skipped: true };

  const { data: existing, error: existingError } = await supabase
    .from("notification_logs")
    .select("id, status")
    .eq("notification_event_id", event.id)
    .eq("order_id", orderId)
    .in("status", ["pending", "sent"])
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { skipped: true };

  const content = emailContent(kind, typedOrder);
  const logInsert: TablesInsert<"notification_logs"> = {
    attempted_at: new Date().toISOString(),
    channel: "email",
    customer_id: typedOrder.customer_id,
    notification_event_id: event.id,
    order_id: typedOrder.id,
    payload: { template: eventKeys[kind] },
    recipient: typedOrder.customers.email,
    status: "pending",
    subject: content.subject,
  };
  const { data: log, error: logError } = await supabase
    .from("notification_logs")
    .insert(logInsert)
    .select("id")
    .single();
  if (logError) throw logError;

  try {
    const messageId = await sendResendEmail({
      html: textToHtml(content.text),
      idempotencyKey: `notification-${log.id}`,
      subject: content.subject,
      text: content.text,
      to: typedOrder.customers.email,
    });
    const { error: updateError } = await supabase
      .from("notification_logs")
      .update({
        response_json: { provider: "resend", providerMessageId: messageId },
        sent_at: new Date().toISOString(),
        status: "sent",
      })
      .eq("id", log.id);
    if (updateError) throw updateError;
    await markIntegrationSuccess("resend");
    return { messageId, skipped: false };
  } catch (sendError) {
    const code = sendError instanceof ResendIntegrationError ? sendError.code : "resend-send-failed";
    await supabase
      .from("notification_logs")
      .update({ error_message: code, status: "failed" })
      .eq("id", log.id);
    await markIntegrationFailure("resend", code).catch(() => undefined);
    throw sendError;
  }
}

function dateKeyOffset(days: number) {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + days);
  return getBusinessDateKey(now);
}

export async function dispatchDueCustomerEmails() {
  await assertResendReady();
  const supabase = createAdminClient();
  const reminderDate = dateKeyOffset(2);
  const reviewCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [bookingResult, reminderResult, reviewResult] = await Promise.all([
    supabase.from("orders").select("id").in("status", ["confirmed", "in-production"]).not("confirmed_at", "is", null),
    supabase.from("orders").select("id").in("status", ["confirmed", "in-production"]).eq("event_date", reminderDate),
    supabase.from("orders").select("id").eq("status", "completed").lte("completed_at", reviewCutoff),
  ]);
  if (bookingResult.error) throw bookingResult.error;
  if (reminderResult.error) throw reminderResult.error;
  if (reviewResult.error) throw reviewResult.error;

  for (const row of bookingResult.data ?? []) await sendOrderLifecycleEmail(row.id, "booking");
  for (const row of reminderResult.data ?? []) await sendOrderLifecycleEmail(row.id, "fulfillment");
  for (const row of reviewResult.data ?? []) await sendOrderLifecycleEmail(row.id, "review");
  return {
    bookingCandidates: bookingResult.data?.length ?? 0,
    reminderCandidates: reminderResult.data?.length ?? 0,
    reviewCandidates: reviewResult.data?.length ?? 0,
  };
}
