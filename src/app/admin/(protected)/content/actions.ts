"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseInteger,
  parseRequiredString,
  redirectWithNotice,
  revalidateMarketingSite,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  contentSectionDefinitions,
  siteSettingDefinitions,
  type ContentSectionDefinition,
  type SiteSettingDefinition,
} from "@/lib/site/marketing";
import type { TablesInsert } from "@/types/supabase.generated";

function getContentDefinition(key: string) {
  return contentSectionDefinitions.find((definition) => definition.key === key) ?? null;
}

function getSiteSettingDefinition(key: string) {
  return siteSettingDefinitions.find((definition) => definition.key === key) ?? null;
}

function buildSettingValue(definition: SiteSettingDefinition, formData: FormData) {
  return definition.fields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field.key] = parseRequiredString(formData.get(`field.${field.key}`));
    return accumulator;
  }, {});
}

function buildContentItems(definition: ContentSectionDefinition, formData: FormData) {
  return definition.fallback.items.map((item, index) =>
    Object.keys(item).reduce<Record<string, string>>((accumulator, key) => {
      accumulator[key] = parseRequiredString(formData.get(`item.${index}.${key}`));
      return accumulator;
    }, {}),
  );
}

function buildContentSettings(definition: ContentSectionDefinition, formData: FormData) {
  return Object.keys(definition.fallback.settings).reduce<Record<string, string>>((accumulator, key) => {
    accumulator[key] = parseRequiredString(formData.get(`setting.${key}`));
    return accumulator;
  }, {});
}

export async function updateSiteSetting(formData: FormData) {
  await requireAdmin();

  const settingKey = parseRequiredString(formData.get("settingKey"));
  const definition = getSiteSettingDefinition(settingKey);
  const redirectTarget = getSafeRedirectTarget(
    formData.get("redirectTo"),
    "/admin/content",
    "/admin/content",
  );

  if (!definition) {
    redirectWithNotice(redirectTarget, "content-error");
  }

  const value = buildSettingValue(definition, formData);

  if (Object.values(value).some((fieldValue) => fieldValue.trim().length === 0)) {
    redirectWithNotice(redirectTarget, "content-error");
  }

  const supabase = createAdminClient();
  const payload: TablesInsert<"site_settings"> = {
    category_key: definition.categoryKey,
    description: definition.description,
    is_public: definition.public,
    label: definition.label,
    setting_key: definition.key,
    value_json: value,
  };
  const { error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "setting_key" });

  if (error) {
    console.error("Unable to update site setting.", error);
    redirectWithNotice(redirectTarget, "content-error");
  }

  revalidatePaths(["/admin/content"]);
  revalidateMarketingSite();
  redirectWithNotice(redirectTarget, "content-updated");
}

export async function updateContentSection(formData: FormData) {
  await requireAdmin();

  const sectionKey = parseRequiredString(formData.get("sectionKey"));
  const definition = getContentDefinition(sectionKey);
  const redirectTarget = getSafeRedirectTarget(
    formData.get("redirectTo"),
    "/admin/content",
    "/admin/content",
  );

  if (!definition) {
    redirectWithNotice(redirectTarget, "content-error");
  }

  const eyebrow = parseRequiredString(formData.get("eyebrow"));
  const heading = parseRequiredString(formData.get("heading"));
  const body = parseRequiredString(formData.get("body"));
  const displayOrder = parseInteger(formData.get("displayOrder"));
  const isActive = parseBoolean(formData.get("isActive"));
  const items = buildContentItems(definition, formData);
  const settings = buildContentSettings(definition, formData);

  if (!heading || !body) {
    redirectWithNotice(redirectTarget, "content-error");
  }

  const supabase = createAdminClient();
  const payload: TablesInsert<"content_blocks"> = {
    block_key: definition.blockKey,
    block_type: definition.blockType,
    body,
    display_order: displayOrder,
    eyebrow: eyebrow || null,
    heading,
    is_active: isActive,
    items_json: items,
    label: definition.title,
    page_key: definition.pageKey,
    section_key: definition.sectionKey,
    settings_json: settings,
  };
  const { error } = await supabase
    .from("content_blocks")
    .upsert(payload, { onConflict: "page_key,section_key,block_key" });

  if (error) {
    console.error("Unable to update content block.", error);
    redirectWithNotice(redirectTarget, "content-error");
  }

  revalidatePaths(["/admin/content"]);
  revalidateMarketingSite();
  redirectWithNotice(redirectTarget, "content-updated");
}
