import "server-only";

import {
  buildReportsSummary,
  getDashboardFinanceVisibility,
  type ReportsSummary,
} from "@/lib/admin/finance";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase.generated";

type OrderRow = Tables<"orders">;
type SiteSettingRow = Tables<"site_settings">;

type ReportsOrderRow = Pick<OrderRow, "event_date" | "id" | "status" | "total_amount">;

export async function getDashboardFinanceSetting() {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for dashboard settings.");
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value_json")
    .eq("setting_key", "dashboard.finance")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return getDashboardFinanceVisibility((data as Pick<SiteSettingRow, "value_json"> | null)?.value_json ?? null);
}

export async function getReportsAdminData(now = new Date()): Promise<ReportsSummary> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin reports.");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, event_date, total_amount")
    .order("event_date", { ascending: true });

  if (error) {
    throw error;
  }

  const orders = ((data ?? []) as ReportsOrderRow[]).map((order) => ({
    eventDate: order.event_date,
    status: order.status,
    totalAmount: order.total_amount,
  }));

  return buildReportsSummary({
    now: now.toISOString(),
    orders,
  });
}
