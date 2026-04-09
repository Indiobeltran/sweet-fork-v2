import "server-only";

import { createClient as createSessionClient } from "@/lib/supabase/server";
import { defaultInquiryFeatureFlags } from "@/lib/inquiries/config";
import { siteSettingDefinitions as marketingSiteSettingDefinitions } from "@/lib/site/marketing";
import type { Json, Tables } from "@/types/supabase.generated";

type SiteSettingRow = Tables<"site_settings">;

type SettingSectionKey = "business" | "inquiries" | "booking";

type TextFieldDefinition = {
  key: string;
  label: string;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  type: "email" | "text" | "textarea" | "url";
};

type BooleanFieldDefinition = {
  key: string;
  label: string;
  helpText?: string;
  type: "boolean";
};

type SelectFieldDefinition = {
  key: string;
  label: string;
  helpText?: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  required?: boolean;
  type: "select";
};

export type AdminSettingFieldDefinition =
  | TextFieldDefinition
  | BooleanFieldDefinition
  | SelectFieldDefinition;

export type AdminSettingDefinition = {
  categoryKey: string;
  description: string;
  fallback: Record<string, boolean | string>;
  fields: AdminSettingFieldDefinition[];
  key: string;
  label: string;
  public: boolean;
  section: SettingSectionKey;
};

export type ManagedAdminSetting = {
  definition: AdminSettingDefinition;
  rowId: string | null;
  value: Record<string, boolean | string>;
};

export type SettingsAdminSection = {
  description: string;
  key: SettingSectionKey;
  settings: ManagedAdminSetting[];
  title: string;
};

export type SettingsAdminData = {
  sections: SettingsAdminSection[];
  summary: Array<{
    detail: string;
    label: string;
    value: string;
  }>;
};

export type LaunchReadinessSection = {
  items: string[];
  title: string;
};

const sectionDefinitions: Array<Pick<SettingsAdminSection, "description" | "key" | "title">> = [
  {
    key: "business",
    title: "Business info and site defaults",
    description:
      "These settings power the brand, contact, and SEO details that are already reused across the public site.",
  },
  {
    key: "inquiries",
    title: "Inquiry intake controls",
    description:
      "Keep the intake flow practical. These flags control uploads, link fallback behavior, and the storage bucket used by inspiration files.",
  },
  {
    key: "booking",
    title: "Booking notices",
    description:
      "Use this when you need a calm heads-up ready for launch week, holiday closures, or limited availability messaging.",
  },
];

const adminSettingDefinitions: AdminSettingDefinition[] = [
  ...marketingSiteSettingDefinitions.map((definition) => ({
    categoryKey: definition.categoryKey,
    description: definition.description,
    fallback: definition.fallback,
    fields: definition.fields,
    key: definition.key,
    label: definition.label,
    public: definition.public,
    section: "business" as const,
  })),
  {
    key: "inquiry.flags",
    categoryKey: "inquiry",
    label: "Inquiry feature flags",
    description:
      "Keeps the Start Order workflow launch-ready without turning it into a complicated settings panel.",
    public: false,
    section: "inquiries",
    fields: [
      {
        key: "uploadsEnabled",
        label: "Allow file uploads",
        helpText: "Turn this off if storage is unavailable or you need to accept links only for a while.",
        type: "boolean",
      },
      {
        key: "linkFallbackEnabled",
        label: "Allow inspiration links",
        helpText: "Leave this on if clients should still be able to share Pinterest or Instagram references.",
        type: "boolean",
      },
      {
        key: "storageBucket",
        label: "Upload bucket",
        helpText: "This should match the Supabase storage bucket that holds inquiry inspiration uploads.",
        required: true,
        type: "text",
      },
    ],
    fallback: {
      uploadsEnabled: defaultInquiryFeatureFlags.uploadsEnabled,
      linkFallbackEnabled: defaultInquiryFeatureFlags.linkFallbackEnabled,
      storageBucket: defaultInquiryFeatureFlags.storageBucket,
    },
  },
  {
    key: "booking.notice",
    categoryKey: "booking",
    label: "Booking notice",
    description:
      "A stored banner-style notice for launch and busy-season operations. It is kept simple on purpose so it stays easy to update.",
    public: false,
    section: "booking",
    fields: [
      {
        key: "enabled",
        label: "Show this notice",
        helpText: "Keep this off until you actually want staff to use the notice copy below.",
        type: "boolean",
      },
      {
        key: "tone",
        label: "Notice tone",
        type: "select",
        options: [
          { label: "Informational", value: "info" },
          { label: "Limited availability", value: "limited" },
          { label: "Temporarily closed", value: "closed" },
        ],
        required: true,
      },
      {
        key: "title",
        label: "Headline",
        required: true,
        type: "text",
      },
      {
        key: "message",
        label: "Message",
        helpText: "Keep this short and clear so it can be reused in a banner or a quick intake notice.",
        required: true,
        type: "textarea",
      },
    ],
    fallback: {
      enabled: false,
      message:
        "Most custom orders need at least 2 weeks notice. Holiday and wedding weekends can book earlier.",
      title: "Limited booking notice",
      tone: "limited",
    },
  },
];

export const launchReadinessSections: LaunchReadinessSection[] = [
  {
    title: "Migration helper notes",
    items: [
      "Link the workspace to the live Supabase project before launch, then run the existing `npm run db:push` and `npm run db:typegen` commands.",
      "This Phase 8 pass stays inside existing tables, so no schema redesign is required for the new admin pages to work.",
      "After migrations, verify seeded reference data and confirm the admin owner account still has matching `profiles` and `user_roles` records.",
    ],
  },
  {
    title: "Launch checklist",
    items: [
      "Review inquiry flags, storage bucket naming, and upload fallback behavior in case clients need to submit links instead of files.",
      "Confirm business info, Instagram, and SEO defaults are correct before pointing the final domain to the site.",
      "Check `/admin/calendar` for upcoming orders and add blackout dates for vacations, sold-out weekends, or major family events.",
      "Check `/admin/notifications` after a test inquiry so the internal notification event and log history look healthy.",
      "Confirm at least one owner account is active and that manager access is limited to the people who should actually run the bakery desk.",
    ],
  },
  {
    title: "Practical operating routine",
    items: [
      "Start each day in inquiries and orders, then use calendar for date pressure and blocked-date awareness.",
      "Use notifications as a visibility screen, not as a promise of automation. It shows what the app recorded, attempted, or skipped.",
      "Keep settings changes small and intentional. This app is designed to stay manual-first and understandable for a non-technical owner.",
    ],
  },
];

function isRecord(value: Json | null): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(record: Record<string, Json> | null, key: string) {
  if (!record) {
    return null;
  }

  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getBooleanValue(record: Record<string, Json> | null, key: string) {
  if (!record) {
    return null;
  }

  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function parseSettingValue(
  definition: AdminSettingDefinition,
  row: SiteSettingRow | null,
): ManagedAdminSetting {
  const record = isRecord(row?.value_json ?? null) ? (row?.value_json as Record<string, Json>) : null;
  const value = definition.fields.reduce<Record<string, boolean | string>>((accumulator, field) => {
    const fallbackValue = definition.fallback[field.key];

    if (field.type === "boolean") {
      accumulator[field.key] =
        getBooleanValue(record, field.key) ?? (typeof fallbackValue === "boolean" ? fallbackValue : false);
      return accumulator;
    }

    if (field.type === "select") {
      const selectedValue = getStringValue(record, field.key);
      const allowedValue = field.options.some((option) => option.value === selectedValue)
        ? selectedValue
        : null;

      accumulator[field.key] =
        allowedValue ?? (typeof fallbackValue === "string" ? fallbackValue : field.options[0]?.value ?? "");
      return accumulator;
    }

    accumulator[field.key] =
      getStringValue(record, field.key) ?? (typeof fallbackValue === "string" ? fallbackValue : "");
    return accumulator;
  }, {});

  return {
    definition,
    rowId: row?.id ?? null,
    value,
  };
}

export function getAdminSettingDefinition(key: string) {
  return adminSettingDefinitions.find((definition) => definition.key === key) ?? null;
}

export async function getSettingsAdminData(): Promise<SettingsAdminData> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin settings.");
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .in(
      "setting_key",
      adminSettingDefinitions.map((definition) => definition.key),
    );

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SiteSettingRow[];
  const rowsByKey = new Map(rows.map((row) => [row.setting_key, row]));
  const settings = adminSettingDefinitions.map((definition) =>
    parseSettingValue(definition, rowsByKey.get(definition.key) ?? null),
  );

  const inquiryFlags = settings.find((setting) => setting.definition.key === "inquiry.flags");
  const bookingNotice = settings.find((setting) => setting.definition.key === "booking.notice");

  return {
    sections: sectionDefinitions.map((section) => ({
      ...section,
      settings: settings.filter((setting) => setting.definition.section === section.key),
    })),
    summary: [
      {
        label: "Managed settings",
        value: String(settings.length),
        detail: "Business details, inquiry controls, and launch notice copy are all kept in one place.",
      },
      {
        label: "Uploads",
        value: inquiryFlags?.value.uploadsEnabled ? "On" : "Off",
        detail: inquiryFlags?.value.linkFallbackEnabled
          ? "Clients can still fall back to links if uploads are unavailable."
          : "Link fallback is off, so file uploads need to stay healthy.",
      },
      {
        label: "Booking notice",
        value: bookingNotice?.value.enabled ? "Ready" : "Off",
        detail: bookingNotice?.value.enabled
          ? "A banner-style message is saved for launch or busy-season communication."
          : "No saved booking notice is currently turned on.",
      },
    ],
  };
}
