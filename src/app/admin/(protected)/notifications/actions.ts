"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseRequiredString,
  redirectWithNotice,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateNotificationEventState(formData: FormData) {
  await requireAdmin();

  const eventId = parseRequiredString(formData.get("eventId"));
  const redirectTarget = getSafeRedirectTarget(
    formData.get("redirectTo"),
    "/admin/notifications",
    "/admin/notifications",
  );

  if (!eventId) {
    redirectWithNotice(redirectTarget, "notifications-error");
  }

  const isActive = parseBoolean(formData.get("isActive"));
  const { error } = await createAdminClient()
    .from("notification_events")
    .update({ is_active: isActive })
    .eq("id", eventId);

  if (error) {
    console.error("Unable to update notification event state.", error);
    redirectWithNotice(redirectTarget, "notifications-error");
  }

  revalidatePaths(["/admin/notifications"]);
  redirectWithNotice(redirectTarget, "notifications-updated");
}
