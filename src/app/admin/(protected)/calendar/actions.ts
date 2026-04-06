"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseOptionalString,
  parseRequiredString,
  redirectWithNotice,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { Constants, type Enums, type TablesInsert } from "@/types/supabase.generated";

function parseDateInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return null;
  }

  return value.trim();
}

function toAllDayIso(dateInput: string) {
  return new Date(`${dateInput}T12:00:00.000Z`).toISOString();
}

export async function createBlackoutDate(formData: FormData) {
  await requireAdmin();

  const redirectTarget = getSafeRedirectTarget(
    formData.get("redirectTo"),
    "/admin/calendar",
    "/admin/calendar",
  );
  const startsOn = parseDateInput(formData.get("startsOn"));
  const endsOn = parseDateInput(formData.get("endsOn")) ?? startsOn;
  const reason = parseRequiredString(formData.get("reason"));
  const notes = parseOptionalString(formData.get("notes"));
  const scope = parseRequiredString(formData.get("scope"));

  if (
    !startsOn ||
    !endsOn ||
    !reason ||
    startsOn > endsOn ||
    !Constants.public.Enums.blackout_scope.includes(scope as Enums<"blackout_scope">)
  ) {
    redirectWithNotice(redirectTarget, "calendar-error");
  }

  const payload: TablesInsert<"blackout_dates"> = {
    ends_on: endsOn,
    is_active: true,
    notes,
    reason,
    scope: scope as Enums<"blackout_scope">,
    starts_on: startsOn,
  };

  const { error } = await createAdminClient().from("blackout_dates").insert(payload);

  if (error) {
    console.error("Unable to create blackout date.", error);
    redirectWithNotice(redirectTarget, "calendar-error");
  }

  revalidatePaths(["/admin/calendar"]);
  redirectWithNotice(redirectTarget, "calendar-updated");
}

export async function toggleBlackoutDateState(formData: FormData) {
  await requireAdmin();

  const redirectTarget = getSafeRedirectTarget(
    formData.get("redirectTo"),
    "/admin/calendar",
    "/admin/calendar",
  );
  const blackoutId = parseRequiredString(formData.get("blackoutId"));

  if (!blackoutId) {
    redirectWithNotice(redirectTarget, "calendar-error");
  }

  const isActive = parseBoolean(formData.get("isActive"));
  const { error } = await createAdminClient()
    .from("blackout_dates")
    .update({ is_active: isActive })
    .eq("id", blackoutId);

  if (error) {
    console.error("Unable to update blackout date state.", error);
    redirectWithNotice(redirectTarget, "calendar-error");
  }

  revalidatePaths(["/admin/calendar"]);
  redirectWithNotice(redirectTarget, "calendar-updated");
}

export async function createCalendarEntry(formData: FormData) {
  await requireAdmin();

  const redirectTarget = getSafeRedirectTarget(
    formData.get("redirectTo"),
    "/admin/calendar",
    "/admin/calendar",
  );
  const title = parseRequiredString(formData.get("title"));
  const entryType = parseRequiredString(formData.get("entryType"));
  const startsOn = parseDateInput(formData.get("startsOn"));
  const endsOn = parseDateInput(formData.get("endsOn")) ?? startsOn;
  const locationText = parseOptionalString(formData.get("locationText"));
  const notes = parseOptionalString(formData.get("notes"));
  const isPrivate = parseBoolean(formData.get("isPrivate"));

  if (
    !title ||
    !startsOn ||
    !endsOn ||
    startsOn > endsOn ||
    !Constants.public.Enums.calendar_entry_type.includes(entryType as Enums<"calendar_entry_type">)
  ) {
    redirectWithNotice(redirectTarget, "calendar-error");
  }

  const payload: TablesInsert<"calendar_entries"> = {
    all_day: true,
    ends_at: endsOn ? toAllDayIso(endsOn) : null,
    entry_type: entryType as Enums<"calendar_entry_type">,
    is_private: isPrivate,
    location_text: locationText,
    notes,
    starts_at: toAllDayIso(startsOn),
    title,
  };

  const { error } = await createAdminClient().from("calendar_entries").insert(payload);

  if (error) {
    console.error("Unable to create calendar entry.", error);
    redirectWithNotice(redirectTarget, "calendar-error");
  }

  revalidatePaths(["/admin/calendar"]);
  redirectWithNotice(redirectTarget, "calendar-updated");
}
