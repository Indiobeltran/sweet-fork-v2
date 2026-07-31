import "server-only";

import { getBusinessDateKey } from "@/lib/business-time";
import { getPublicEnv } from "@/lib/env";
import { getIntegrationConfig } from "@/lib/integrations/config";
import {
  createGoogleCalendarEvent,
  createGoogleCalendarWatch,
  deleteGoogleCalendarEvent,
  GoogleCalendarIntegrationError,
  type GoogleCalendarEvent,
  type GoogleCalendarEventInput,
  listGoogleCalendarEvents,
  updateGoogleCalendarEvent,
} from "@/lib/integrations/google-calendar";
import {
  findIntegrationLink,
  getIntegrationConnection,
  markIntegrationFailure,
  markIntegrationSuccess,
  recordSyncConflict,
  updateIntegrationConnection,
  upsertIntegrationLink,
} from "@/lib/integrations/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums, Json, Tables, TablesInsert } from "@/types/supabase.generated";

type ConnectionConfig = {
  watchChannelExpiration?: string;
  watchChannelId?: string;
  watchResourceId?: string;
  syncToken?: string;
};

function object(value: Json | null | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function connectionConfig(value: Json | null | undefined): ConnectionConfig {
  const record = object(value);
  return {
    syncToken: typeof record.syncToken === "string" ? record.syncToken : undefined,
    watchChannelExpiration: typeof record.watchChannelExpiration === "string" ? record.watchChannelExpiration : undefined,
    watchChannelId: typeof record.watchChannelId === "string" ? record.watchChannelId : undefined,
    watchResourceId: typeof record.watchResourceId === "string" ? record.watchResourceId : undefined,
  };
}

async function assertGoogleCalendarReady() {
  const config = getIntegrationConfig().googleCalendar;
  const connection = await getIntegrationConnection("google-calendar");
  if (!config.enabled || !connection?.enabled || connection.status === "disabled") {
    throw new GoogleCalendarIntegrationError("google-calendar-disabled");
  }
  return connection;
}

function nextDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function previousDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

function eventDateKey(event: GoogleCalendarEvent) {
  if (event.start?.date) return event.start.date;
  if (event.start?.dateTime) return getBusinessDateKey(new Date(event.start.dateTime));
  return null;
}

function orderEventInput(order: {
  due_at: string | null;
  event_date: string;
  event_type: string;
  fulfillment_method: string;
  id: string;
  order_items: Array<{ product_label: string; quantity: number }>;
}): GoogleCalendarEventInput {
  const productSummary = order.order_items
    .map((item) => `${item.quantity}× ${item.product_label}`)
    .join(", ")
    .slice(0, 120);
  const reference = `ORD-${order.id.slice(0, 8).toUpperCase()}`;
  const timed = order.due_at && getBusinessDateKey(new Date(order.due_at)) === order.event_date;

  return {
    description: `Sweet Fork admin: ${getPublicEnv().siteUrl}/admin/orders/${order.id}`,
    end: timed
      ? { dateTime: new Date(new Date(order.due_at as string).getTime() + 60 * 60 * 1000).toISOString(), timeZone: "America/Denver" }
      : { date: nextDate(order.event_date) },
    extendedProperties: { private: { sweetForkOrderId: order.id } },
    start: timed
      ? { dateTime: order.due_at as string, timeZone: "America/Denver" }
      : { date: order.event_date },
    summary: `${reference} · ${order.fulfillment_method === "delivery" ? "Delivery" : "Pickup"} · ${productSummary || order.event_type}`,
  };
}

function calendarEntryInput(entry: Tables<"calendar_entries">): GoogleCalendarEventInput {
  const startDateKey = getBusinessDateKey(new Date(entry.starts_at));
  const endDateKey = entry.ends_at ? getBusinessDateKey(new Date(entry.ends_at)) : startDateKey;
  return {
    description: entry.notes ?? undefined,
    end: entry.all_day
      ? { date: nextDate(endDateKey) }
      : { dateTime: entry.ends_at ?? new Date(new Date(entry.starts_at).getTime() + 60 * 60 * 1000).toISOString(), timeZone: "America/Denver" },
    extendedProperties: { private: { sweetForkCalendarEntryId: entry.id } },
    location: entry.location_text ?? undefined,
    start: entry.all_day
      ? { date: startDateKey }
      : { dateTime: entry.starts_at, timeZone: "America/Denver" },
    summary: entry.title,
  };
}

export async function syncConfirmedOrderToGoogleCalendar(orderId: string) {
  await assertGoogleCalendarReady();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, event_date, due_at, event_type, fulfillment_method, order_items(product_label, quantity)")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) throw new GoogleCalendarIntegrationError("calendar-order-not-found");

  const existing = await findIntegrationLink({
    externalEntityType: "event",
    localEntityId: orderId,
    localEntityType: "order",
    provider: "google-calendar",
  });

  if (data.status === "cancelled") {
    if (existing) {
      await deleteGoogleCalendarEvent(existing.external_id).catch((deleteError) => {
        if (!(deleteError instanceof GoogleCalendarIntegrationError && deleteError.status === 410)) throw deleteError;
      });
    }
    return null;
  }

  if (!["confirmed", "in-production", "fulfilled", "completed"].includes(data.status)) return null;
  const input = orderEventInput(data);
  const event = existing
    ? await updateGoogleCalendarEvent(existing.external_id, input)
    : await createGoogleCalendarEvent(input);
  await upsertIntegrationLink({
    external_entity_type: "event",
    external_id: event.id,
    external_version: event.etag ?? null,
    last_synced_at: new Date().toISOString(),
    local_entity_id: orderId,
    local_entity_type: "order",
    provider: "google-calendar",
  });
  return event;
}

async function processExternalEvent(event: GoogleCalendarEvent) {
  const supabase = createAdminClient();
  const orderId = event.extendedProperties?.private?.sweetForkOrderId;
  const entryId = event.extendedProperties?.private?.sweetForkCalendarEntryId;
  const existing = await findIntegrationLink({
    externalEntityType: "event",
    externalId: event.id,
    provider: "google-calendar",
  });

  if (orderId || existing?.local_entity_type === "order") {
    const localOrderId = orderId ?? existing?.local_entity_id;
    if (!localOrderId) return;
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, event_date, due_at, event_type, fulfillment_method, order_items(product_label, quantity)")
      .eq("id", localOrderId)
      .maybeSingle();
    if (error || !order) return;
    const externalDate = eventDateKey(event);
    if (externalDate && externalDate !== order.event_date) {
      await recordSyncConflict({
        conflictType: "google-order-date-change",
        externalValue: externalDate,
        fieldName: "event_date",
        integrationLinkId: existing?.id ?? null,
        localEntityId: order.id,
        localEntityType: "order",
        localValue: order.event_date,
        provider: "google-calendar",
      });
      await syncConfirmedOrderToGoogleCalendar(order.id);
      return;
    }
    if (event.start?.dateTime) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ due_at: event.start.dateTime })
        .eq("id", order.id);
      if (updateError) throw updateError;
    }
    await upsertIntegrationLink({
      external_entity_type: "event",
      external_id: event.id,
      external_version: event.etag ?? null,
      last_synced_at: new Date().toISOString(),
      local_entity_id: order.id,
      local_entity_type: "order",
      provider: "google-calendar",
    });
    return;
  }

  const localEntryId = entryId ?? (existing?.local_entity_type === "calendar-entry" ? existing.local_entity_id : null);
  if (event.status === "cancelled") {
    if (localEntryId) await supabase.from("calendar_entries").delete().eq("id", localEntryId);
    if (existing) await supabase.from("integration_links").delete().eq("id", existing.id);
    return;
  }
  if (!event.start || !event.end) return;
  const allDay = Boolean(event.start.date);
  const startsAt = allDay
    ? new Date(`${event.start.date}T12:00:00-06:00`).toISOString()
    : event.start.dateTime;
  const endsAt = allDay
    ? event.end.date ? new Date(`${previousDate(event.end.date)}T12:00:00-06:00`).toISOString() : null
    : event.end.dateTime ?? null;
  if (!startsAt) return;
  const values = {
    all_day: allDay,
    ends_at: endsAt,
    entry_type: "personal" as Enums<"calendar_entry_type">,
    is_private: true,
    location_text: event.location ?? null,
    notes: event.description ?? null,
    starts_at: startsAt,
    title: event.summary?.trim() || "Busy",
  };
  let savedId = localEntryId;
  if (localEntryId) {
    const { error } = await supabase.from("calendar_entries").update(values).eq("id", localEntryId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("calendar_entries")
      .insert(values satisfies TablesInsert<"calendar_entries">)
      .select("id")
      .single();
    if (error) throw error;
    savedId = data.id;
  }
  if (savedId) {
    await upsertIntegrationLink({
      external_entity_type: "event",
      external_id: event.id,
      external_version: event.etag ?? null,
      last_synced_at: new Date().toISOString(),
      local_entity_id: savedId,
      local_entity_type: "calendar-entry",
      provider: "google-calendar",
    });
  }
}

async function pushLocalCalendarEntries() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("calendar_entries")
    .select("*")
    .gte("starts_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
    .lte("starts_at", new Date(Date.now() + 540 * 24 * 60 * 60 * 1000).toISOString());
  if (error) throw error;

  for (const entry of data ?? []) {
    const link = await findIntegrationLink({
      externalEntityType: "event",
      localEntityId: entry.id,
      localEntityType: "calendar-entry",
      provider: "google-calendar",
    });
    const input = calendarEntryInput(entry);
    const event = link
      ? await updateGoogleCalendarEvent(link.external_id, input)
      : await createGoogleCalendarEvent(input);
    await upsertIntegrationLink({
      external_entity_type: "event",
      external_id: event.id,
      external_version: event.etag ?? null,
      last_synced_at: new Date().toISOString(),
      local_entity_id: entry.id,
      local_entity_type: "calendar-entry",
      provider: "google-calendar",
    });
  }
}

export async function syncGoogleCalendar() {
  try {
    const connection = await assertGoogleCalendarReady();
    const config = connectionConfig(connection.config_json);
    let result;
    try {
      result = await listGoogleCalendarEvents(config.syncToken);
    } catch (error) {
      if (!(error instanceof GoogleCalendarIntegrationError && error.status === 410)) throw error;
      result = await listGoogleCalendarEvents();
    }
    for (const event of result.events) await processExternalEvent(event);
    await pushLocalCalendarEntries();

    const supabase = createAdminClient();
    const { data: confirmedOrders, error } = await supabase
      .from("orders")
      .select("id")
      .in("status", ["confirmed", "in-production", "fulfilled", "completed"])
      .gte("event_date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    if (error) throw error;
    for (const order of confirmedOrders ?? []) await syncConfirmedOrderToGoogleCalendar(order.id);

    await updateIntegrationConnection("google-calendar", {
      config_json: { ...object(connection.config_json), syncToken: result.nextSyncToken ?? config.syncToken },
    });
    await markIntegrationSuccess("google-calendar");
    return { eventCount: result.events.length };
  } catch (error) {
    const code = error instanceof GoogleCalendarIntegrationError ? error.code : "google-calendar-sync-failed";
    await markIntegrationFailure("google-calendar", code).catch(() => undefined);
    throw error;
  }
}

export async function renewGoogleCalendarWatch() {
  const connection = await assertGoogleCalendarReady();
  const config = connectionConfig(connection.config_json);
  const expiresAt = config.watchChannelExpiration ? Number(config.watchChannelExpiration) : 0;
  if (expiresAt > Date.now() + 24 * 60 * 60 * 1000) return { renewed: false };

  const watch = await createGoogleCalendarWatch(
    `${getPublicEnv().siteUrl}/api/integrations/google-calendar/webhook`,
  );
  await updateIntegrationConnection("google-calendar", {
    config_json: {
      ...object(connection.config_json),
      watchChannelExpiration: watch.expiration ?? null,
      watchChannelId: watch.id,
      watchResourceId: watch.resourceId,
    },
  });
  return { renewed: true };
}
