import "server-only";

import { getInquiryReferenceCode } from "@/lib/admin/order-workflow";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { Constants, type Enums, type Json, type Tables } from "@/types/supabase.generated";

type CustomerRow = Tables<"customers">;
type InquiryRow = Tables<"inquiries">;
type NotificationEventRow = Tables<"notification_events">;
type NotificationLogRow = Tables<"notification_logs">;
type OrderRow = Tables<"orders">;

export type NotificationFilters = {
  channel: Enums<"notification_channel"> | "all";
  search: string;
  status: Enums<"notification_delivery_status"> | "all";
};

export type NotificationEventEntry = {
  categoryKey: string;
  defaultChannels: string[];
  description: string | null;
  eventKey: string;
  id: string;
  isActive: boolean;
  lastLoggedAt: string | null;
  recentFailureCount: number;
  recentLogCount: number;
  templateKey: string | null;
};

export type NotificationLogEntry = {
  attemptedAt: string | null;
  categoryKey: string | null;
  channel: Enums<"notification_channel">;
  createdAt: string;
  errorMessage: string | null;
  eventKey: string | null;
  id: string;
  payload: Json;
  recipient: string;
  relatedHref: string | null;
  relatedLabel: string | null;
  responseJson: Json;
  sentAt: string | null;
  status: Enums<"notification_delivery_status">;
  subject: string | null;
  templateKey: string | null;
};

export type NotificationsAdminData = {
  events: NotificationEventEntry[];
  filters: NotificationFilters;
  logs: NotificationLogEntry[];
  summary: Array<{
    detail: string;
    label: string;
    value: string;
  }>;
  totalLogCount: number;
};

function getStringArray(value: Json) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseNotificationFilters(
  rawSearchParams: Record<string, string | string[] | undefined>,
): NotificationFilters {
  const status = getSearchValue(rawSearchParams.status);
  const channel = getSearchValue(rawSearchParams.channel);
  const search = getSearchValue(rawSearchParams.search).trim();

  return {
    channel: Constants.public.Enums.notification_channel.includes(
      channel as Enums<"notification_channel">,
    )
      ? (channel as Enums<"notification_channel">)
      : "all",
    search,
    status: Constants.public.Enums.notification_delivery_status.includes(
      status as Enums<"notification_delivery_status">,
    )
      ? (status as Enums<"notification_delivery_status">)
      : "all",
  };
}

function getRelatedRecordLabel(
  log: Pick<NotificationLogRow, "customer_id" | "inquiry_id" | "order_id">,
  relatedRecords: {
    customers: Map<string, Pick<CustomerRow, "email" | "full_name" | "id">>;
    inquiries: Map<string, Pick<InquiryRow, "customer_name" | "id" | "metadata">>;
    orders: Map<string, Pick<OrderRow, "event_date" | "event_type" | "id" | "status">>;
  },
) {
  if (log.order_id) {
    const order = relatedRecords.orders.get(log.order_id);

    if (order) {
      return {
        href: `/admin/orders/${order.id}`,
        label: `${order.event_type} order on ${order.event_date}`,
      };
    }
  }

  if (log.inquiry_id) {
    const inquiry = relatedRecords.inquiries.get(log.inquiry_id);

    if (inquiry) {
      return {
        href: `/admin/inquiries/${inquiry.id}`,
        label: `Inquiry ${getInquiryReferenceCode(inquiry)} from ${inquiry.customer_name}`,
      };
    }
  }

  if (log.customer_id) {
    const customer = relatedRecords.customers.get(log.customer_id);

    if (customer) {
      return {
        href: `/admin/customers/${customer.id}`,
        label: customer.full_name || customer.email || `Customer ${customer.id.slice(0, 8)}`,
      };
    }
  }

  return {
    href: null,
    label: null,
  };
}

export async function getNotificationsAdminData(
  filters: NotificationFilters,
): Promise<NotificationsAdminData> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin notifications.");
  }

  const [{ data: eventData, error: eventError }, { data: logData, error: logError }] =
    await Promise.all([
      supabase.from("notification_events").select("*").order("category_key", { ascending: true }),
      supabase
        .from("notification_logs")
        .select(
          "id, notification_event_id, inquiry_id, order_id, customer_id, channel, status, recipient, subject, payload, response_json, error_message, attempted_at, sent_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  if (eventError) {
    throw eventError;
  }

  if (logError) {
    throw logError;
  }

  const events = (eventData ?? []) as NotificationEventRow[];
  const logs = (logData ?? []) as Array<
    Pick<
      NotificationLogRow,
      | "attempted_at"
      | "channel"
      | "created_at"
      | "customer_id"
      | "error_message"
      | "id"
      | "inquiry_id"
      | "notification_event_id"
      | "order_id"
      | "payload"
      | "recipient"
      | "response_json"
      | "sent_at"
      | "status"
      | "subject"
    >
  >;

  const customerIds = Array.from(
    new Set(logs.map((log) => log.customer_id).filter(Boolean) as string[]),
  );
  const inquiryIds = Array.from(
    new Set(logs.map((log) => log.inquiry_id).filter(Boolean) as string[]),
  );
  const orderIds = Array.from(new Set(logs.map((log) => log.order_id).filter(Boolean) as string[]));

  const [{ data: customerData, error: customerError }, { data: inquiryData, error: inquiryError }, { data: orderData, error: orderError }] =
    await Promise.all([
      customerIds.length > 0
        ? supabase
            .from("customers")
            .select("id, full_name, email")
            .in("id", customerIds)
        : Promise.resolve({ data: [], error: null }),
      inquiryIds.length > 0
        ? supabase
            .from("inquiries")
            .select("id, customer_name, metadata")
            .in("id", inquiryIds)
        : Promise.resolve({ data: [], error: null }),
      orderIds.length > 0
        ? supabase
            .from("orders")
            .select("id, event_date, event_type, status")
            .in("id", orderIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (customerError) {
    throw customerError;
  }

  if (inquiryError) {
    throw inquiryError;
  }

  if (orderError) {
    throw orderError;
  }

  const eventMap = new Map(events.map((event) => [event.id, event]));
  const customerMap = new Map(
    ((customerData ?? []) as Array<Pick<CustomerRow, "email" | "full_name" | "id">>).map((row) => [row.id, row]),
  );
  const inquiryMap = new Map(
    ((inquiryData ?? []) as Array<Pick<InquiryRow, "customer_name" | "id" | "metadata">>).map((row) => [row.id, row]),
  );
  const orderMap = new Map(
    ((orderData ?? []) as Array<Pick<OrderRow, "event_date" | "event_type" | "id" | "status">>).map((row) => [row.id, row]),
  );

  const eventEntries = events.map((event) => {
    const relatedLogs = logs.filter((log) => log.notification_event_id === event.id);

    return {
      categoryKey: event.category_key,
      defaultChannels: getStringArray(event.default_channels),
      description: event.description,
      eventKey: event.event_key,
      id: event.id,
      isActive: event.is_active,
      lastLoggedAt: relatedLogs[0]?.created_at ?? null,
      recentFailureCount: relatedLogs.filter((log) => log.status === "failed").length,
      recentLogCount: relatedLogs.length,
      templateKey: event.template_key,
    } satisfies NotificationEventEntry;
  });

  const logEntries = logs
    .map((log) => {
      const event = log.notification_event_id ? eventMap.get(log.notification_event_id) : null;
      const related = getRelatedRecordLabel(log, {
        customers: customerMap,
        inquiries: inquiryMap,
        orders: orderMap,
      });

      return {
        attemptedAt: log.attempted_at,
        categoryKey: event?.category_key ?? null,
        channel: log.channel,
        createdAt: log.created_at,
        errorMessage: log.error_message,
        eventKey: event?.event_key ?? null,
        id: log.id,
        payload: log.payload,
        recipient: log.recipient,
        relatedHref: related.href,
        relatedLabel: related.label,
        responseJson: log.response_json,
        sentAt: log.sent_at,
        status: log.status,
        subject: log.subject,
        templateKey: event?.template_key ?? null,
      } satisfies NotificationLogEntry;
    })
    .filter((entry) => {
      if (filters.status !== "all" && entry.status !== filters.status) {
        return false;
      }

      if (filters.channel !== "all" && entry.channel !== filters.channel) {
        return false;
      }

      if (!filters.search) {
        return true;
      }

      const haystack = [
        entry.categoryKey,
        entry.errorMessage,
        entry.eventKey,
        entry.recipient,
        entry.relatedLabel,
        entry.subject,
        entry.templateKey,
        entry.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(filters.search.toLowerCase());
    });

  const failedCount = logEntries.filter((entry) => entry.status === "failed").length;
  const pendingCount = logEntries.filter((entry) => entry.status === "pending").length;
  const sentCount = logEntries.filter((entry) => entry.status === "sent").length;

  return {
    events: eventEntries,
    filters,
    logs: logEntries,
    summary: [
      {
        label: "Notification events",
        value: String(eventEntries.length),
        detail: `${eventEntries.filter((event) => event.isActive).length} currently active in the catalog.`,
      },
      {
        label: "Visible logs",
        value: String(logEntries.length),
        detail:
          filters.search || filters.status !== "all" || filters.channel !== "all"
            ? `${logs.length} recent log rows loaded before filtering.`
            : "Recent delivery history across channels and internal notifications.",
      },
      {
        label: "Pending or failed",
        value: String(pendingCount + failedCount),
        detail:
          failedCount === 0
            ? `${pendingCount} log row${pendingCount === 1 ? "" : "s"} still waiting on follow-through.`
            : `${failedCount} failed and ${pendingCount} still pending in the current view.`,
      },
      {
        label: "Sent",
        value: String(sentCount),
        detail: "Rows marked sent in the currently visible history.",
      },
    ],
    totalLogCount: logs.length,
  };
}
