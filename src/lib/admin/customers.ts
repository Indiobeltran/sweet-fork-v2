import "server-only";

import { createClient as createSessionClient } from "@/lib/supabase/server";
import {
  formatOrderMoneySummary,
  getInquiryReferenceCode,
  getRepeatCustomerLabel,
  getRepeatCustomerValue,
} from "@/lib/admin/order-workflow";
import { toTitleCase } from "@/lib/utils";
import type { Enums, Tables } from "@/types/supabase.generated";

type CustomerRow = Tables<"customers">;
type InquiryRow = Tables<"inquiries">;
type OrderRow = Tables<"orders">;

type CustomerListQueryRow = Pick<
  CustomerRow,
  | "created_at"
  | "email"
  | "full_name"
  | "id"
  | "last_inquiry_at"
  | "last_order_at"
  | "lead_source"
  | "phone"
  | "preferred_contact"
  | "updated_at"
> & {
  inquiries: Array<Pick<InquiryRow, "id">> | null;
  orders: Array<Pick<OrderRow, "event_date" | "id" | "payment_status" | "status">> | null;
};

type CustomerDetailQueryRow = CustomerRow & {
  inquiries:
    | Array<
        Pick<InquiryRow, "event_date" | "event_type" | "id" | "metadata" | "status" | "submitted_at">
      >
    | null;
  orders:
    | Array<
        Pick<
          OrderRow,
          "event_date" | "event_type" | "fulfillment_method" | "id" | "payment_status" | "status" | "total_amount"
        >
      >
    | null;
};

export type CustomerListFilters = {
  preferredContact: Enums<"contact_preference"> | "all";
  repeatState: "all" | "new" | "repeat";
  search: string;
};

export type CustomerListEntry = {
  email: string | null;
  fullName: string;
  id: string;
  lastInquiryAt: string | null;
  lastOrderAt: string | null;
  leadSource: string | null;
  orderCount: number;
  phone: string | null;
  preferredContact: Enums<"contact_preference">;
  repeatLabel: string;
  repeatValue: boolean;
};

export type CustomerListData = {
  entries: CustomerListEntry[];
  filters: CustomerListFilters;
  summary: Array<{
    detail: string;
    label: string;
    value: string;
  }>;
  totalCount: number;
};

export type CustomerOrderHistoryEntry = {
  eventDate: string;
  eventType: string;
  fulfillmentMethod: Enums<"fulfillment_method">;
  id: string;
  paymentStatus: Enums<"payment_status">;
  status: Enums<"order_status">;
  totalLabel: string;
};

export type CustomerInquiryHistoryEntry = {
  eventDate: string;
  eventType: string;
  id: string;
  referenceCode: string;
  status: Enums<"inquiry_status">;
  submittedAt: string;
};

export type CustomerDetail = {
  createdAt: string;
  defaultFulfillmentMethod: Enums<"fulfillment_method"> | null;
  email: string | null;
  fullName: string;
  id: string;
  instagramHandle: string | null;
  inquiries: CustomerInquiryHistoryEntry[];
  lastInquiryAt: string | null;
  lastOrderAt: string | null;
  leadSource: string | null;
  notes: string | null;
  orderCount: number;
  orders: CustomerOrderHistoryEntry[];
  phone: string | null;
  preferredContact: Enums<"contact_preference">;
  repeatLabel: string;
  repeatValue: boolean;
  updatedAt: string;
};

const DEFAULT_CUSTOMER_LIST_FILTERS: CustomerListFilters = {
  preferredContact: "all",
  repeatState: "all",
  search: "",
};

function normalizeFilterValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseCustomerListFilters(
  rawSearchParams: Record<string, string | string[] | undefined>,
): CustomerListFilters {
  const next: CustomerListFilters = { ...DEFAULT_CUSTOMER_LIST_FILTERS };

  const search = normalizeFilterValue(rawSearchParams.search).trim();
  if (search.length > 0) {
    next.search = search;
  }

  const preferredContact = normalizeFilterValue(rawSearchParams.preferredContact);
  if (preferredContact === "email" || preferredContact === "text" || preferredContact === "phone") {
    next.preferredContact = preferredContact;
  }

  const repeatState = normalizeFilterValue(rawSearchParams.repeatState);
  if (repeatState === "new" || repeatState === "repeat") {
    next.repeatState = repeatState;
  }

  return next;
}

export async function getCustomerListData(
  filters: CustomerListFilters,
): Promise<CustomerListData> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin customers.");
  }

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, full_name, email, phone, preferred_contact, lead_source, last_inquiry_at, last_order_at, created_at, updated_at, orders(id, event_date, status, payment_status), inquiries(id)",
    )
    .order("last_order_at", { ascending: false, nullsFirst: false })
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as CustomerListQueryRow[];
  const entries = rows
    .map((row) => {
      const orderCount = row.orders?.length ?? 0;
      const inquiryCount = row.inquiries?.length ?? 0;

      return {
        email: row.email,
        fullName: row.full_name,
        id: row.id,
        lastInquiryAt: row.last_inquiry_at,
        lastOrderAt: row.last_order_at,
        leadSource: row.lead_source,
        orderCount,
        phone: row.phone,
        preferredContact: row.preferred_contact,
        repeatLabel: getRepeatCustomerLabel(orderCount, inquiryCount),
        repeatValue: getRepeatCustomerValue(orderCount, inquiryCount),
      } satisfies CustomerListEntry;
    })
    .filter((entry) => {
      if (
        filters.preferredContact !== "all" &&
        entry.preferredContact !== filters.preferredContact
      ) {
        return false;
      }

      if (filters.repeatState === "repeat" && !entry.repeatValue) {
        return false;
      }

      if (filters.repeatState === "new" && entry.repeatValue) {
        return false;
      }

      if (filters.search.length === 0) {
        return true;
      }

      const haystack = [entry.fullName, entry.email, entry.phone, entry.leadSource]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(filters.search.toLowerCase());
    });

  const repeatCount = entries.filter((entry) => entry.repeatValue).length;
  const emailPreferredCount = entries.filter((entry) => entry.preferredContact === "email").length;

  return {
    entries,
    filters,
    summary: [
      {
        detail: rows.length === entries.length ? "All customers currently shown" : `${rows.length} total customers in the system`,
        label: "Visible customers",
        value: String(entries.length),
      },
      {
        detail:
          repeatCount === 0
            ? "No repeat customers in this view yet"
            : "Customers with repeat history or more than one inquiry touchpoint",
        label: "Repeat customers",
        value: String(repeatCount),
      },
      {
        detail:
          emailPreferredCount === 0
            ? "No email-first contacts in the current view"
            : "Customers who prefer email as the main follow-up channel",
        label: "Email preferred",
        value: String(emailPreferredCount),
      },
    ],
    totalCount: rows.length,
  };
}

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin customers.");
  }

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, full_name, email, phone, instagram_handle, preferred_contact, lead_source, notes, default_fulfillment_method, last_inquiry_at, last_order_at, created_at, updated_at, orders(id, event_date, event_type, fulfillment_method, status, payment_status, total_amount), inquiries(id, event_date, event_type, status, submitted_at, metadata)",
    )
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as CustomerDetailQueryRow;
  const orderCount = row.orders?.length ?? 0;
  const inquiryCount = row.inquiries?.length ?? 0;

  return {
    createdAt: row.created_at,
    defaultFulfillmentMethod: row.default_fulfillment_method,
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    instagramHandle: row.instagram_handle,
    inquiries: (row.inquiries ?? []).map((inquiry) => ({
      eventDate: inquiry.event_date,
      eventType: inquiry.event_type,
      id: inquiry.id,
      referenceCode: getInquiryReferenceCode(inquiry),
      status: inquiry.status,
      submittedAt: inquiry.submitted_at,
    })),
    lastInquiryAt: row.last_inquiry_at,
    lastOrderAt: row.last_order_at,
    leadSource: row.lead_source,
    notes: row.notes,
    orderCount,
    orders: (row.orders ?? []).map((order) => ({
      eventDate: order.event_date,
      eventType: order.event_type,
      fulfillmentMethod: order.fulfillment_method,
      id: order.id,
      paymentStatus: order.payment_status,
      status: order.status,
      totalLabel: formatOrderMoneySummary(order.total_amount),
    })),
    phone: row.phone,
    preferredContact: row.preferred_contact,
    repeatLabel: getRepeatCustomerLabel(orderCount, inquiryCount),
    repeatValue: getRepeatCustomerValue(orderCount, inquiryCount),
    updatedAt: row.updated_at,
  };
}

export function getPreferredContactLabel(value: Enums<"contact_preference">) {
  return toTitleCase(value);
}
