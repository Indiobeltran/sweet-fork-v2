"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseRequiredString,
  redirectWithNotice,
  revalidateMarketingSite,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { getAdminSettingDefinition, type AdminSettingDefinition } from "@/lib/admin/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/types/supabase.generated";

function buildSettingValue(definition: AdminSettingDefinition, formData: FormData) {
  return definition.fields.reduce<Record<string, boolean | string>>((accumulator, field) => {
    if (field.type === "boolean") {
      accumulator[field.key] = parseBoolean(formData.get(`field.${field.key}`));
      return accumulator;
    }

    const value = parseRequiredString(formData.get(`field.${field.key}`));

    if (field.type === "select") {
      const isAllowed = field.options.some((option) => option.value === value);
      accumulator[field.key] = isAllowed ? value : "";
      return accumulator;
    }

    accumulator[field.key] = value;
    return accumulator;
  }, {});
}

function isSettingValueValid(
  definition: AdminSettingDefinition,
  value: Record<string, boolean | string>,
) {
  return definition.fields.every((field) => {
    const fieldValue = value[field.key];

    if (field.type === "boolean") {
      return typeof fieldValue === "boolean";
    }

    if (field.type === "select") {
      return typeof fieldValue === "string" && field.options.some((option) => option.value === fieldValue);
    }

    if (field.required) {
      return typeof fieldValue === "string" && fieldValue.trim().length > 0;
    }

    return typeof fieldValue === "string";
  });
}

export async function saveAdminSetting(formData: FormData) {
  await requireAdmin();

  const settingKey = parseRequiredString(formData.get("settingKey"));
  const definition = getAdminSettingDefinition(settingKey);
  const redirectTarget = getSafeRedirectTarget(
    formData.get("redirectTo"),
    "/admin/settings",
    "/admin/settings",
  );

  if (!definition) {
    redirectWithNotice(redirectTarget, "settings-error");
  }

  const value = buildSettingValue(definition, formData);

  if (!isSettingValueValid(definition, value)) {
    redirectWithNotice(redirectTarget, "settings-error");
  }

  const payload: TablesInsert<"site_settings"> = {
    category_key: definition.categoryKey,
    description: definition.description,
    is_public: definition.public,
    label: definition.label,
    setting_key: definition.key,
    value_json: value,
  };

  const { error } = await createAdminClient()
    .from("site_settings")
    .upsert(payload, { onConflict: "setting_key" });

  if (error) {
    console.error("Unable to save admin setting.", error);
    redirectWithNotice(redirectTarget, "settings-error");
  }

  revalidatePaths(["/admin/settings"]);
  revalidateMarketingSite();
  redirectWithNotice(redirectTarget, "settings-updated");
}
