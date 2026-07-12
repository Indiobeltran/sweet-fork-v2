"use server";

import { z } from "zod";

import { revalidatePaths, redirectWithNotice } from "@/lib/admin/action-helpers";
import {
  QUOTE_PROFILE_SETTING_KEY,
  resolveQuotePricingProfile,
} from "@/lib/admin/quotes";
import { requireAdmin } from "@/lib/auth";
import { getBusinessDateKey } from "@/lib/business-time";
import {
  buildDefaultCustomerMessage,
  buildDefaultCustomerScope,
  buildQuoteSnapshot,
  getCurrentQuoteVersion,
  getNextQuoteVersion,
  parseQuoteSnapshot,
  type QuoteSnapshot,
} from "@/lib/quotes/workflow";
import {
  parsePricingProfile,
  parseQuoteInput,
} from "@/lib/quotes/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/supabase.generated";

const postgresUuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
);

type QuoteRow = Tables<"inquiry_quotes">;
type QuoteItemRow = Pick<Tables<"inquiry_items">, "id" | "product_type">;

function quoteRedirect(inquiryId: string) {
  return `/admin/inquiries/${inquiryId}/quote`;
}

function fail(inquiryId: string, notice = "quote-error"): never {
  redirectWithNotice(
    postgresUuidSchema.safeParse(inquiryId).success
      ? quoteRedirect(inquiryId)
      : "/admin/inquiries",
    notice,
  );
}

function parseJsonField(formData: FormData, field: string) {
  const value = formData.get(field);
  if (typeof value !== "string" || value.length === 0 || value.length > 250_000) {
    throw new Error(`Invalid ${field}.`);
  }
  return JSON.parse(value) as unknown;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function safeDatabaseLog(operation: string, error: { code?: string | null } | null) {
  console.error("Quote persistence operation failed.", {
    code: error?.code ?? "unknown",
    operation,
  });
}

async function loadProfile(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value_json")
    .eq("setting_key", QUOTE_PROFILE_SETTING_KEY)
    .maybeSingle();

  if (error) throw error;
  return resolveQuotePricingProfile(data?.value_json, Boolean(data)).profile;
}

async function loadInquiryContext(
  supabase: ReturnType<typeof createAdminClient>,
  inquiryId: string,
) {
  const [inquiryResult, itemsResult] = await Promise.all([
    supabase
      .from("inquiries")
      .select("id, event_date")
      .eq("id", inquiryId)
      .maybeSingle(),
    supabase
      .from("inquiry_items")
      .select("id, product_type")
      .eq("inquiry_id", inquiryId),
  ]);

  if (inquiryResult.error) throw inquiryResult.error;
  if (itemsResult.error) throw itemsResult.error;
  if (!inquiryResult.data) throw new Error("Inquiry not found.");

  return {
    eventDate: inquiryResult.data.event_date,
    items: (itemsResult.data ?? []) as QuoteItemRow[],
  };
}

function assertInputMatchesInquiry(input: ReturnType<typeof parseQuoteInput>, items: QuoteItemRow[]) {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const seen = new Set<string>();

  if (input.lines.length !== items.length) {
    throw new Error("Quote lines must match the inquiry items.");
  }

  input.lines.forEach((line) => {
    const item = itemById.get(line.id);
    if (!item || item.product_type !== line.productKey || seen.has(line.id)) {
      throw new Error("Quote lines must match the inquiry items.");
    }
    seen.add(line.id);
  });
}

async function loadQuoteVersions(
  supabase: ReturnType<typeof createAdminClient>,
  inquiryId: string,
) {
  const { data, error } = await supabase
    .from("inquiry_quotes")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("version", { ascending: false });

  if (error) throw error;
  return (data ?? []) as QuoteRow[];
}

function customerCopy(
  snapshot: QuoteSnapshot,
  eventDate: string,
) {
  const scope = buildDefaultCustomerScope(snapshot.input, snapshot.profile);
  const message = buildDefaultCustomerMessage({
    calculation: snapshot.calculation,
    eventDate,
    scope,
  });

  return { message, scope };
}

function quoteValues(snapshot: QuoteSnapshot, copy: { message: string; scope: string }) {
  return {
    calculation_snapshot: toJson(snapshot),
    customer_message: copy.message,
    customer_scope: copy.scope,
    deposit_amount: snapshot.calculation.pricing.depositAmount,
    final_price: snapshot.calculation.pricing.customerTotal,
    valid_through: snapshot.calculation.metadata.validThrough,
  };
}

function revalidateQuoteRoutes(inquiryId: string) {
  revalidatePaths([
    "/admin/inquiries",
    `/admin/inquiries/${inquiryId}`,
    quoteRedirect(inquiryId),
    "/admin/orders",
  ]);
}

export async function saveQuoteDraft(formData: FormData) {
  const admin = await requireAdmin();
  const inquiryId = String(formData.get("inquiryId") ?? "").trim();
  if (!postgresUuidSchema.safeParse(inquiryId).success) fail(inquiryId);

  try {
    const supabase = createAdminClient();
    const [profile, context, versions] = await Promise.all([
      loadProfile(supabase),
      loadInquiryContext(supabase, inquiryId),
      loadQuoteVersions(supabase, inquiryId),
    ]);
    const parsedInput = parseQuoteInput(parseJsonField(formData, "quoteInputJson"));
    assertInputMatchesInquiry(parsedInput, context.items);
    const snapshot = buildQuoteSnapshot(profile, {
      ...parsedInput,
      issuedOn: parsedInput.issuedOn ?? getBusinessDateKey(new Date()),
    });
    const copy = customerCopy(snapshot, context.eventDate);
    const current = getCurrentQuoteVersion(versions);

    if (current?.status === "finalized") fail(inquiryId, "quote-revision-required");

    if (current) {
      const update: TablesUpdate<"inquiry_quotes"> = quoteValues(snapshot, copy);
      const { data, error } = await supabase
        .from("inquiry_quotes")
        .update(update)
        .eq("id", current.id)
        .eq("inquiry_id", inquiryId)
        .eq("status", "draft")
        .eq("is_current", true)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        safeDatabaseLog("save-draft-update", error);
        fail(inquiryId);
      }
    } else {
      const insert: TablesInsert<"inquiry_quotes"> = {
        ...quoteValues(snapshot, copy),
        created_by: admin.id,
        inquiry_id: inquiryId,
        is_current: true,
        status: "draft",
        version: getNextQuoteVersion(versions),
      };
      const { error } = await supabase.from("inquiry_quotes").insert(insert);
      if (error) {
        safeDatabaseLog("save-draft-insert", error);
        fail(inquiryId);
      }
    }

    revalidateQuoteRoutes(inquiryId);
    redirectWithNotice(quoteRedirect(inquiryId), "quote-draft-saved");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail(inquiryId);
  }
}

export async function finalizeQuoteDraft(formData: FormData) {
  await requireAdmin();
  const inquiryId = String(formData.get("inquiryId") ?? "").trim();
  if (!postgresUuidSchema.safeParse(inquiryId).success) fail(inquiryId);

  try {
    const supabase = createAdminClient();
    const [context, versions] = await Promise.all([
      loadInquiryContext(supabase, inquiryId),
      loadQuoteVersions(supabase, inquiryId),
    ]);
    const current = getCurrentQuoteVersion(versions);
    if (!current || current.status !== "draft") fail(inquiryId, "quote-finalize-error");

    const snapshot = parseQuoteSnapshot(current.calculation_snapshot);
    assertInputMatchesInquiry(snapshot.input, context.items);
    const copy = customerCopy(snapshot, context.eventDate);
    const update: TablesUpdate<"inquiry_quotes"> = {
      ...quoteValues(snapshot, copy),
      finalized_at: new Date().toISOString(),
      is_current: true,
      status: "finalized",
    };
    const { data, error } = await supabase
      .from("inquiry_quotes")
      .update(update)
      .eq("id", current.id)
      .eq("inquiry_id", inquiryId)
      .eq("status", "draft")
      .eq("is_current", true)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      safeDatabaseLog("finalize-draft", error);
      fail(inquiryId, "quote-finalize-error");
    }

    revalidateQuoteRoutes(inquiryId);
    redirectWithNotice(quoteRedirect(inquiryId), "quote-finalized");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail(inquiryId, "quote-finalize-error");
  }
}

export async function createQuoteRevision(formData: FormData) {
  const admin = await requireAdmin();
  const inquiryId = String(formData.get("inquiryId") ?? "").trim();
  if (!postgresUuidSchema.safeParse(inquiryId).success) fail(inquiryId);

  try {
    const supabase = createAdminClient();
    const [profile, versions, context] = await Promise.all([
      loadProfile(supabase),
      loadQuoteVersions(supabase, inquiryId),
      loadInquiryContext(supabase, inquiryId),
    ]);
    const current = getCurrentQuoteVersion(versions);
    if (!current || current.status !== "finalized") fail(inquiryId, "quote-revision-error");

    const previousSnapshot = parseQuoteSnapshot(current.calculation_snapshot);
    assertInputMatchesInquiry(previousSnapshot.input, context.items);
    const snapshot = buildQuoteSnapshot(profile, {
      ...previousSnapshot.input,
      issuedOn: getBusinessDateKey(new Date()),
    });
    const copy = customerCopy(snapshot, context.eventDate);
    const values = quoteValues(snapshot, copy);
    const { error: revisionError } = await supabase.rpc("create_inquiry_quote_revision", {
      p_calculation_snapshot: values.calculation_snapshot,
      p_current_quote_id: current.id,
      p_created_by: admin.id,
      p_customer_message: values.customer_message,
      p_customer_scope: values.customer_scope,
      p_deposit_amount: values.deposit_amount,
      p_final_price: values.final_price,
      p_inquiry_id: inquiryId,
      p_valid_through: values.valid_through,
      p_version: getNextQuoteVersion(versions),
    });
    if (revisionError) {
      safeDatabaseLog("revision-create", revisionError);
      fail(inquiryId, "quote-revision-error");
    }

    revalidateQuoteRoutes(inquiryId);
    redirectWithNotice(quoteRedirect(inquiryId), "quote-revision-created");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail(inquiryId, "quote-revision-error");
  }
}

export async function savePricingProfile(formData: FormData) {
  await requireAdmin(["owner"]);
  const inquiryId = String(formData.get("inquiryId") ?? "").trim();
  if (!postgresUuidSchema.safeParse(inquiryId).success) fail(inquiryId, "pricing-profile-error");

  try {
    const submittedProfile = parsePricingProfile(parseJsonField(formData, "pricingProfileJson"));
    const supabase = createAdminClient();
    const currentProfile = await loadProfile(supabase);
    const nextProfile = parsePricingProfile({
      ...submittedProfile,
      version: currentProfile.version + 1,
    });
    const payload: TablesInsert<"site_settings"> = {
      category_key: "quote",
      description: "Editable labor, cost, margin, delivery, and product assumptions used by the inquiry quote builder.",
      is_public: false,
      label: "Quote pricing profile",
      setting_key: QUOTE_PROFILE_SETTING_KEY,
      value_json: toJson(nextProfile),
    };
    const { error } = await supabase
      .from("site_settings")
      .upsert(payload, { onConflict: "setting_key" });
    if (error) {
      safeDatabaseLog("save-pricing-profile", error);
      fail(inquiryId, "pricing-profile-error");
    }

    revalidatePaths([
      quoteRedirect(inquiryId),
      "/admin/inquiries",
      `/admin/inquiries/${inquiryId}`,
      "/admin/orders",
      "/admin/settings",
    ]);
    redirectWithNotice(quoteRedirect(inquiryId), "pricing-profile-saved");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail(inquiryId, "pricing-profile-error");
  }
}
