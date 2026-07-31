import "server-only";

import { getIntegrationConfigurationStatus, integrationProviders } from "@/lib/integrations/config";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/supabase.generated";

export type IntegrationHealthItem = {
  configured: boolean;
  displayName: string;
  enabled: boolean;
  environmentEnabled: boolean;
  lastErrorCode: string | null;
  lastEventAt: string | null;
  lastSuccessAt: string | null;
  lastSyncAt: string | null;
  mode: string;
  openConflictCount: number;
  provider: (typeof integrationProviders)[number];
  recentFailedEventCount: number;
  status: string;
};

export type IntegrationConflictItem = {
  conflictType: string;
  detectedAt: string;
  externalValue: Json;
  fieldName: string | null;
  id: string;
  localEntityId: string | null;
  localEntityType: string | null;
  localValue: Json;
  provider: string;
};

export async function getIntegrationHealthData() {
  const supabase = await createSessionClient();
  const environmentStatus = getIntegrationConfigurationStatus();

  if (!supabase) {
    return { conflicts: [], integrations: [] };
  }

  const [connectionsResult, conflictsResult, failedEventsResult] = await Promise.all([
    supabase.from("integration_connections").select("*").order("provider"),
    supabase
      .from("integration_sync_conflicts")
      .select("id, provider, local_entity_type, local_entity_id, conflict_type, field_name, local_value, external_value, detected_at")
      .eq("status", "open")
      .order("detected_at", { ascending: false })
      .limit(20),
    supabase
      .from("integration_webhook_events")
      .select("provider")
      .eq("status", "failed")
      .gte("received_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  if (connectionsResult.error) {
    const missingFoundation = connectionsResult.error.code === "42P01" || connectionsResult.error.code === "PGRST205";
    if (missingFoundation) return { conflicts: [], integrations: [] };
    throw connectionsResult.error;
  }
  if (conflictsResult.error) throw conflictsResult.error;
  if (failedEventsResult.error) throw failedEventsResult.error;

  const conflictRows = (conflictsResult.data ?? []) as Array<
    Pick<
      Tables<"integration_sync_conflicts">,
      | "conflict_type"
      | "detected_at"
      | "external_value"
      | "field_name"
      | "id"
      | "local_entity_id"
      | "local_entity_type"
      | "local_value"
      | "provider"
    >
  >;
  const failedEventRows = (failedEventsResult.data ?? []) as Array<
    Pick<Tables<"integration_webhook_events">, "provider">
  >;
  const connectionRows = (connectionsResult.data ?? []) as Array<
    Tables<"integration_connections">
  >;

  const conflicts = conflictRows.map((row) => ({
    conflictType: row.conflict_type,
    detectedAt: row.detected_at,
    externalValue: row.external_value,
    fieldName: row.field_name,
    id: row.id,
    localEntityId: row.local_entity_id,
    localEntityType: row.local_entity_type,
    localValue: row.local_value,
    provider: row.provider,
  } satisfies IntegrationConflictItem));

  const failedCounts = new Map<string, number>();
  failedEventRows.forEach((row) => {
    failedCounts.set(row.provider, (failedCounts.get(row.provider) ?? 0) + 1);
  });

  const connections = new Map(connectionRows.map((row) => [row.provider, row]));
  const integrations = integrationProviders.map((provider) => {
    const row = connections.get(provider);
    const environment = environmentStatus[provider];

    return {
      configured: environment.configured,
      displayName: row?.display_name ?? provider,
      enabled: Boolean(row?.enabled && environment.enabled),
      environmentEnabled: environment.enabled,
      lastErrorCode: row?.last_error_code ?? null,
      lastEventAt: row?.last_event_at ?? null,
      lastSuccessAt: row?.last_success_at ?? null,
      lastSyncAt: row?.last_sync_at ?? null,
      mode: provider === "square" ? environment.mode : row?.mode ?? environment.mode,
      openConflictCount: conflicts.filter((conflict) => conflict.provider === provider).length,
      provider,
      recentFailedEventCount: failedCounts.get(provider) ?? 0,
      status: !environment.configured
        ? "not-configured"
        : !environment.enabled || !row?.enabled
          ? "disabled"
          : row.status,
    } satisfies IntegrationHealthItem;
  });

  return { conflicts, integrations };
}
