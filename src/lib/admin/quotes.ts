import "server-only";

import { getCurrentAdmin } from "@/lib/auth";
import { getBusinessDateKey } from "@/lib/business-time";
import { defaultPricingProfile } from "@/lib/quotes/default-profile";
import type { PricingProfile, QuoteInput } from "@/lib/quotes/types";
import {
  getCurrentQuoteVersion,
  normalizeInquiryItemsToQuoteInput,
  parseQuoteSnapshot,
  type QuoteSnapshot,
} from "@/lib/quotes/workflow";
import { parsePricingProfile } from "@/lib/quotes/validation";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase.generated";

export const QUOTE_PROFILE_SETTING_KEY = "quote.pricing-profile";

type InquiryQuoteRow = Tables<"inquiry_quotes">;
type InquiryItemRow = Pick<
  Tables<"inquiry_items">,
  "id" | "product_label" | "product_type" | "quantity" | "sort_order"
>;

export type SavedInquiryQuote = Omit<InquiryQuoteRow, "calculation_snapshot"> & {
  snapshot: QuoteSnapshot | null;
  snapshotNotice: string | null;
};

export type QuoteBuilderData = {
  calibrationNotice: string | null;
  currentQuote: SavedInquiryQuote | null;
  inquiry: {
    contact: {
      email: string;
      name: string;
      phone: string;
    };
    event: {
      date: string;
      fulfillmentMethod: "delivery" | "pickup";
      type: string;
      venueAddress: string | null;
      venueName: string | null;
    };
    id: string;
    items: InquiryItemRow[];
  };
  isOwner: boolean;
  pricingProfile: PricingProfile;
  pricingProfileSource: "default" | "stored";
  quoteVersions: SavedInquiryQuote[];
  startingInput: QuoteInput | null;
};

export function resolveQuotePricingProfile(value: unknown, settingExists: boolean) {
  if (settingExists) {
    const parsed = (() => {
      try {
        return parsePricingProfile(value);
      } catch {
        return null;
      }
    })();

    if (parsed) {
      return {
        notice: null,
        profile: parsed,
        source: "stored" as const,
      };
    }
  }

  return {
    notice: settingExists
      ? "The saved pricing profile is invalid. The default calibration seed is active until an owner reviews and saves the profile."
      : "No saved pricing profile was found. The default calibration seed is active until an owner reviews and saves the profile.",
    profile: structuredClone(defaultPricingProfile) as PricingProfile,
    source: "default" as const,
  };
}

function mapQuoteRow(row: InquiryQuoteRow): SavedInquiryQuote {
  const { calculation_snapshot: calculationSnapshot, ...quote } = row;

  try {
    return {
      ...quote,
      snapshot: parseQuoteSnapshot(calculationSnapshot),
      snapshotNotice: null,
    };
  } catch {
    return {
      ...quote,
      snapshot: null,
      snapshotNotice: "This saved quote snapshot is invalid and cannot be reused safely.",
    };
  }
}

export async function getQuoteBuilderData(inquiryId: string): Promise<QuoteBuilderData | null> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin quotes.");
  }

  const [admin, inquiryResult, itemsResult, settingResult, quotesResult] = await Promise.all([
    getCurrentAdmin(),
    supabase
      .from("inquiries")
      .select("id, customer_name, customer_email, customer_phone, event_type, event_date, fulfillment_method, venue_name, venue_address")
      .eq("id", inquiryId)
      .maybeSingle(),
    supabase
      .from("inquiry_items")
      .select("id, product_type, product_label, quantity, sort_order")
      .eq("inquiry_id", inquiryId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("site_settings")
      .select("value_json")
      .eq("setting_key", QUOTE_PROFILE_SETTING_KEY)
      .maybeSingle(),
    supabase
      .from("inquiry_quotes")
      .select("*")
      .eq("inquiry_id", inquiryId)
      .order("version", { ascending: false }),
  ]);

  if (inquiryResult.error) throw inquiryResult.error;
  if (itemsResult.error) throw itemsResult.error;
  if (settingResult.error) throw settingResult.error;
  if (quotesResult.error) throw quotesResult.error;
  if (!inquiryResult.data) return null;

  const inquiry = inquiryResult.data as Pick<
    Tables<"inquiries">,
    | "customer_email"
    | "customer_name"
    | "customer_phone"
    | "event_date"
    | "event_type"
    | "fulfillment_method"
    | "id"
    | "venue_address"
    | "venue_name"
  >;
  const setting = settingResult.data as Pick<Tables<"site_settings">, "value_json"> | null;
  const items = (itemsResult.data ?? []) as InquiryItemRow[];
  const pricing = resolveQuotePricingProfile(
    setting?.value_json,
    Boolean(setting),
  );
  const quoteVersions = ((quotesResult.data ?? []) as InquiryQuoteRow[]).map(mapQuoteRow);
  const currentQuote = getCurrentQuoteVersion(quoteVersions);
  let startingInput: QuoteInput | null = null;

  if (items.length > 0) {
    startingInput = normalizeInquiryItemsToQuoteInput(
      items,
      inquiry.fulfillment_method,
      getBusinessDateKey(new Date()),
    );
  }

  return {
    calibrationNotice: pricing.notice,
    currentQuote,
    inquiry: {
      contact: {
        email: inquiry.customer_email,
        name: inquiry.customer_name,
        phone: inquiry.customer_phone,
      },
      event: {
        date: inquiry.event_date,
        fulfillmentMethod: inquiry.fulfillment_method,
        type: inquiry.event_type,
        venueAddress: inquiry.venue_address,
        venueName: inquiry.venue_name,
      },
      id: inquiry.id,
      items,
    },
    isOwner: admin?.role === "owner",
    pricingProfile: pricing.profile,
    pricingProfileSource: pricing.source,
    quoteVersions,
    startingInput,
  };
}

export async function getCurrentFinalizedQuote(inquiryId: string) {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin quotes.");
  }

  const { data, error } = await supabase
    .from("inquiry_quotes")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .eq("is_current", true)
    .eq("status", "finalized")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const quote = mapQuoteRow(data as InquiryQuoteRow);
  if (!quote.snapshot) {
    throw new Error("The current finalized quote has an invalid snapshot.");
  }

  return quote;
}
