import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { IntegrationProvider } from "@/lib/integrations/config";
import type { Json, TablesInsert, TablesUpdate } from "@/types/supabase.generated";

export async function getIntegrationConnection(provider: IntegrationProvider) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateIntegrationConnection(
  provider: IntegrationProvider,
  update: TablesUpdate<"integration_connections">,
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("integration_connections")
    .update(update)
    .eq("provider", provider);

  if (error) throw error;
}

export async function findIntegrationLink(input: {
  externalEntityType?: string;
  externalId?: string;
  localEntityId?: string;
  localEntityType?: string;
  provider: IntegrationProvider;
}) {
  const supabase = createAdminClient();
  let query = supabase.from("integration_links").select("*").eq("provider", input.provider);

  if (input.externalEntityType) query = query.eq("external_entity_type", input.externalEntityType);
  if (input.externalId) query = query.eq("external_id", input.externalId);
  if (input.localEntityType) query = query.eq("local_entity_type", input.localEntityType);
  if (input.localEntityId) query = query.eq("local_entity_id", input.localEntityId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertIntegrationLink(
  link: TablesInsert<"integration_links">,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("integration_links")
    .upsert(link, {
      onConflict: "provider,local_entity_type,local_entity_id,external_entity_type",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function recordWebhookReceipt(input: {
  checksum: string;
  entityId?: string | null;
  entityType?: string | null;
  eventId: string;
  eventType: string;
  occurredAt?: string | null;
  provider: IntegrationProvider;
}) {
  const supabase = createAdminClient();
  const insert: TablesInsert<"integration_webhook_events"> = {
    entity_id: input.entityId,
    entity_type: input.entityType,
    event_type: input.eventType,
    external_event_id: input.eventId,
    occurred_at: input.occurredAt,
    payload_checksum: input.checksum,
    provider: input.provider,
  };
  const { data, error } = await supabase
    .from("integration_webhook_events")
    .upsert(insert, { ignoreDuplicates: true, onConflict: "provider,external_event_id" })
    .select("id, status")
    .maybeSingle();

  if (error) throw error;

  await updateIntegrationConnection(input.provider, {
    last_event_at: new Date().toISOString(),
  });

  return data;
}

export async function markWebhookProcessed(
  provider: IntegrationProvider,
  eventId: string,
  result: { errorCode?: string | null; status: "failed" | "ignored" | "processed" },
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("integration_webhook_events")
    .update({
      attempt_count: result.status === "failed" ? 1 : 0,
      error_code: result.errorCode ?? null,
      processed_at: new Date().toISOString(),
      status: result.status,
    })
    .eq("provider", provider)
    .eq("external_event_id", eventId);

  if (error) throw error;
}

export async function recordSyncConflict(input: {
  conflictType: string;
  externalValue?: Json;
  fieldName?: string | null;
  integrationLinkId?: string | null;
  localEntityId?: string | null;
  localEntityType?: string | null;
  localValue?: Json;
  provider: IntegrationProvider;
}) {
  const supabase = createAdminClient();
  let existingQuery = supabase
    .from("integration_sync_conflicts")
    .select("id")
    .eq("provider", input.provider)
    .eq("conflict_type", input.conflictType)
    .eq("status", "open");
  if (input.localEntityId) existingQuery = existingQuery.eq("local_entity_id", input.localEntityId);
  if (input.fieldName) existingQuery = existingQuery.eq("field_name", input.fieldName);
  const { data: existing, error: existingError } = await existingQuery.limit(1).maybeSingle();
  if (existingError) throw existingError;
  if (existing) return;
  const { error } = await supabase.from("integration_sync_conflicts").insert({
    conflict_type: input.conflictType,
    external_value: input.externalValue ?? null,
    field_name: input.fieldName,
    integration_link_id: input.integrationLinkId,
    local_entity_id: input.localEntityId,
    local_entity_type: input.localEntityType,
    local_value: input.localValue ?? null,
    provider: input.provider,
  } satisfies TablesInsert<"integration_sync_conflicts">);

  if (error) throw error;
}

export async function markIntegrationSuccess(provider: IntegrationProvider) {
  const now = new Date().toISOString();
  await updateIntegrationConnection(provider, {
    last_error_code: null,
    last_error_message: null,
    last_success_at: now,
    last_sync_at: now,
    status: "ready",
  });
}

export async function markIntegrationFailure(
  provider: IntegrationProvider,
  code: string,
) {
  await updateIntegrationConnection(provider, {
    last_error_code: code,
    last_error_message: "Review the provider configuration and integration logs.",
    last_sync_at: new Date().toISOString(),
    status: "error",
  });
}
