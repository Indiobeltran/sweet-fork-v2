"use server";

import { revalidatePath } from "next/cache";

import { redirectWithNotice } from "@/lib/admin/action-helpers";
import { requireAdmin } from "@/lib/auth";
import { integrationProviders, type IntegrationProvider } from "@/lib/integrations/config";
import { createAdminClient } from "@/lib/supabase/admin";

function isProvider(value: string): value is IntegrationProvider {
  return integrationProviders.includes(value as IntegrationProvider);
}

export async function updateIntegrationEnabled(formData: FormData) {
  await requireAdmin(["owner"]);
  const provider = String(formData.get("provider") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";

  if (!isProvider(provider)) {
    redirectWithNotice("/admin/settings", "integration-error");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("integration_connections")
    .update({ enabled, status: enabled ? "ready" : "disabled" })
    .eq("provider", provider);

  if (error) {
    redirectWithNotice("/admin/settings", "integration-error");
  }

  revalidatePath("/admin/settings");
  redirectWithNotice("/admin/settings", enabled ? "integration-enabled" : "integration-disabled");
}

export async function resolveIntegrationConflict(formData: FormData) {
  const admin = await requireAdmin();
  const conflictId = String(formData.get("conflictId") ?? "");
  const resolution = String(formData.get("resolution") ?? "resolved");

  if (!/^[0-9a-f-]{36}$/i.test(conflictId) || !["resolved", "ignored"].includes(resolution)) {
    redirectWithNotice("/admin/settings", "integration-error");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("integration_sync_conflicts")
    .update({
      resolution_note: resolution === "ignored" ? "Ignored by an administrator." : "Reviewed by an administrator.",
      resolved_at: new Date().toISOString(),
      resolved_by: admin.id,
      status: resolution,
    })
    .eq("id", conflictId)
    .eq("status", "open");

  if (error) {
    redirectWithNotice("/admin/settings", "integration-error");
  }

  revalidatePath("/admin/settings");
  redirectWithNotice("/admin/settings", "integration-conflict-resolved");
}
