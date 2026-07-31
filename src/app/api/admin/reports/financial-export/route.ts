import { getCurrentAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!await getCurrentAdmin()) return new Response("Unauthorized", { status: 401 });
  const month = new URL(request.url).searchParams.get("month");
  if (month && !/^\d{4}-\d{2}$/.test(month)) return new Response("Invalid month", { status: 400 });

  const supabase = createAdminClient();
  let query = supabase
    .from("orders")
    .select("id, event_date, event_type, status, payment_status, total_amount, deposit_due_amount, balance_due_amount, customers(full_name), payments(amount, paid_at, payment_type, status, provider_name, provider_intent_id, reference_code)")
    .order("event_date", { ascending: true });
  if (month) {
    const start = `${month}-01`;
    const endDate = new Date(`${start}T12:00:00Z`);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    query = query.gte("event_date", start).lt("event_date", endDate.toISOString().slice(0, 10));
  }
  const { data, error } = await query;
  if (error) return new Response("Export unavailable", { status: 500 });

  const rows: Array<Array<string | number | null>> = [[
    "order_reference", "customer", "event_date", "event_type", "order_status", "payment_status",
    "order_total", "deposit_due", "balance_due", "paid_amount", "refund_amount", "square_paid_amount",
    "latest_payment_date", "provider_references",
  ]];
  for (const order of data ?? []) {
    const payments = order.payments ?? [];
    const paid = payments.filter((p) => p.status === "paid" && p.payment_type !== "refund").reduce((sum, p) => sum + p.amount, 0);
    const refunds = payments.filter((p) => p.payment_type === "refund" || p.status === "refunded").reduce((sum, p) => sum + p.amount, 0);
    const squarePaid = payments.filter((p) => p.provider_name === "square" && p.status === "paid" && p.payment_type !== "refund").reduce((sum, p) => sum + p.amount, 0);
    const providerReferences = payments
      .filter((p) => p.provider_name || p.provider_intent_id || p.reference_code)
      .map((p) => [p.provider_name, p.provider_intent_id, p.reference_code].filter(Boolean).join(":"))
      .join(" | ");
    rows.push([
      `ORD-${order.id.slice(0, 8).toUpperCase()}`,
      order.customers?.full_name ?? "",
      order.event_date, order.event_type, order.status, order.payment_status,
      order.total_amount, order.deposit_due_amount, order.balance_due_amount, paid, refunds, squarePaid,
      payments.map((p) => p.paid_at).filter(Boolean).sort().at(-1) ?? "", providerReferences,
    ]);
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const suffix = month ?? "all-orders";
  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="sweet-fork-financial-${suffix}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
