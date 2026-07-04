"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseInteger,
  parseOptionalString,
  parseRequiredString,
  redirectWithNotice,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { Constants, type Enums, type TablesInsert, type Json } from "@/types/supabase.generated";
import { buildProductPointLookup, isShortLeadTime, validateProductCapacitySettings } from "@/lib/admin/capacity";
import { getBusinessDateKey, getBusinessDayUtcRange } from "@/lib/business-time";
import { getInquiryReferenceCode } from "@/lib/admin/order-workflow";

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

export async function updateWeeklyCapacityCeiling(formData: FormData) {
  await requireAdmin();

  const weeklyCapacityCeiling = parseInteger(formData.get("weeklyCapacityCeiling"), 12);

  if (Number.isNaN(weeklyCapacityCeiling) || weeklyCapacityCeiling < 1 || weeklyCapacityCeiling > 100) {
    return { success: false, error: "Weekly ceiling must be a positive integer between 1 and 100." };
  }

  const payload: TablesInsert<"site_settings"> = {
    category_key: "capacity",
    description: "Operational workload capacity settings for the admin calendar.",
    is_public: false,
    label: "Capacity settings",
    setting_key: "capacity.settings",
    value_json: {
      week_start_day: 0,
      weekly_capacity_ceiling: weeklyCapacityCeiling,
    },
  };

  const { error } = await createAdminClient()
    .from("site_settings")
    .upsert(payload, { onConflict: "setting_key" });

  if (error) {
    console.error("Unable to update weekly capacity ceiling.", error);
    return { success: false, error: "Database error saving capacity ceiling." };
  }

  revalidatePaths(["/admin/calendar", "/admin/settings"]);
  return { success: true };
}

export async function deleteBlackoutDate(formData: FormData) {
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

  const { error } = await createAdminClient()
    .from("blackout_dates")
    .delete()
    .eq("id", blackoutId);

  if (error) {
    console.error("Unable to delete blackout date.", error);
    redirectWithNotice(redirectTarget, "calendar-error");
  }

  revalidatePaths(["/admin/calendar"]);
  redirectWithNotice(redirectTarget, "calendar-updated");
}

export async function getCalendarDayDetails(dateKey: string, contributingOrderIds: string[]) {
  await requireAdmin();

  const supabase = createAdminClient();

  // 1. Fetch products
  const { data: productsData } = await supabase
    .from("products")
    .select("id, capacity_points, product_type, prep_days, min_lead_time_days");
  
  const productLookup = buildProductPointLookup(
    (productsData ?? []).map((product) => ({
      capacityPoints: product.capacity_points ?? null,
      id: product.id,
      productType: product.product_type,
      prepDays: product.prep_days,
      minLeadTimeDays: product.min_lead_time_days,
    }))
  );

  // 2. Fetch orders due/prep contributing
  let orders: Array<{
    id: string;
    event_date: string;
    event_type: string;
    status: Enums<"order_status">;
    fulfillment_method: Enums<"fulfillment_method">;
    inquiry_id: string | null;
    customer: { id: string; full_name: string | null } | null;
    inquiry: { id: string; metadata: Json } | null;
  }> = [];
  if (contributingOrderIds.length > 0) {
    const { data } = await supabase
      .from("orders")
      .select(`
        id,
        event_date,
        event_type,
        status,
        fulfillment_method,
        inquiry_id,
        customer:customers(id, full_name),
        inquiry:inquiries(id, metadata)
      `)
      .in("id", contributingOrderIds);
    orders = (data ?? []) as unknown as typeof orders; // Cast from Supabase select output type
  }

  // 3. Fetch active inquiries on dateKey
  const { data: inquiriesData } = await supabase
    .from("inquiries")
    .select(`
      id,
      customer_name,
      event_date,
      status,
      fulfillment_method,
      metadata,
      submitted_at,
      inquiry_items(id, product_type)
    `)
    .eq("event_date", dateKey)
    .in("status", ["new", "reviewing", "quoted", "approved"])
    .order("submitted_at", { ascending: true });

  const inquiries = (inquiriesData ?? []).map((inq) => {
    const todayKey = inq.submitted_at ? getBusinessDateKey(new Date(inq.submitted_at)) : "";
    const isShortLead = isShortLeadTime(
      inq.event_date,
      (inq.inquiry_items ?? []).map((item) => ({
        productId: null,
        productType: item.product_type,
      })),
      productLookup,
      todayKey
    );

    // Format reference code
    const reference = getInquiryReferenceCode({
      id: inq.id,
      metadata: inq.metadata,
    });

    return {
      id: inq.id,
      customerName: inq.customer_name,
      eventDate: inq.event_date,
      status: inq.status,
      fulfillmentMethod: inq.fulfillment_method,
      reference,
      isShortLead,
    };
  });

  // 4. Fetch blackout dates
  const { data: blackouts } = await supabase
    .from("blackout_dates")
    .select("id, starts_on, ends_on, reason, scope, notes, is_active")
    .lte("starts_on", dateKey)
    .gte("ends_on", dateKey);

  // 5. Fetch notes (calendar entries)
  const { endIso: endOfDay, startIso: startOfDay } = getBusinessDayUtcRange(dateKey);
  const { data: notes } = await supabase
    .from("calendar_entries")
    .select("id, entry_type, title, starts_at, ends_at, all_day, notes, is_private, location_text")
    .lte("starts_at", endOfDay)
    .or(`ends_at.gte.${startOfDay},ends_at.is.null`)
    .order("starts_at", { ascending: true });

  const filteredNotes = (notes ?? []).filter((note) => {
    const startKey = getBusinessDateKey(new Date(note.starts_at));
    const endKey = note.ends_at ? getBusinessDateKey(new Date(note.ends_at)) : startKey;
    return dateKey >= startKey && dateKey <= endKey;
  });

  return {
    orders: orders.map((order) => {
      const reference = order.inquiry
        ? getInquiryReferenceCode(order.inquiry)
        : `ORD-${order.id.slice(0, 8).toUpperCase()}`;
      return {
        id: order.id,
        eventDate: order.event_date,
        eventType: order.event_type,
        status: order.status,
        fulfillmentMethod: order.fulfillment_method,
        customerName: order.customer?.full_name ?? "Sweet Fork client",
        reference,
      };
    }),
    inquiries,
    blackouts: blackouts ?? [],
    notes: filteredNotes,
  };
}

export async function updateProductCapacitySettings(formData: FormData) {
  await requireAdmin();

  const productId = parseRequiredString(formData.get("productId"));
  const capacityPoints = parseInteger(formData.get("capacityPoints"), 2);
  const prepDays = parseInteger(formData.get("prepDays"), 0);
  const minLeadTimeDays = parseInteger(formData.get("minLeadTimeDays"), 3);

  if (!productId) {
    return { success: false, error: "Missing product identifier." };
  }

  const validation = validateProductCapacitySettings(capacityPoints, prepDays, minLeadTimeDays);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const { error } = await createAdminClient()
    .from("products")
    .update({
      capacity_points: capacityPoints,
      prep_days: prepDays,
      min_lead_time_days: minLeadTimeDays,
    })
    .eq("id", productId);

  if (error) {
    console.error("Unable to update product capacity settings.", error);
    return { success: false, error: "Database error saving capacity settings." };
  }

  revalidatePaths(["/admin/calendar", "/admin/products", "/admin/pricing"]);
  return { success: true };
}
