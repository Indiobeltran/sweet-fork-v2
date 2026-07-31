import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/auth";
import { defaultPricingProfile } from "@/lib/quotes/default-profile";
import type { PricingProfile } from "@/lib/quotes/types";
import { parsePricingProfile } from "@/lib/quotes/validation";
import { getIntegrationConnection } from "@/lib/integrations/repository";
import { calculateDeliveryRoute, GoogleMapsIntegrationError } from "@/lib/integrations/google-maps";
import { sha256 } from "@/lib/integrations/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { inquiryId?: string } | null;
  if (!body?.inquiryId) return NextResponse.json({ error: "Inquiry is required." }, { status: 400 });

  const supabase = createAdminClient();
  const [connection, inquiryResult, profileResult] = await Promise.all([
    getIntegrationConnection("google-maps"),
    supabase.from("inquiries").select("id, venue_address").eq("id", body.inquiryId).maybeSingle(),
    supabase.from("site_settings").select("value_json").eq("setting_key", "quote.pricing-profile").maybeSingle(),
  ]);
  if (!connection?.enabled || connection.status === "disabled") {
    return NextResponse.json({ error: "Delivery routing is not enabled." }, { status: 409 });
  }
  if (inquiryResult.error || !inquiryResult.data?.venue_address) {
    return NextResponse.json({ error: "Add a complete venue address first." }, { status: 422 });
  }
  let profile: PricingProfile = defaultPricingProfile;
  if (profileResult.data?.value_json) {
    try { profile = parsePricingProfile(profileResult.data.value_json); } catch { /* use reviewed seed */ }
  }

  try {
    const route = await calculateDeliveryRoute(inquiryResult.data.venue_address);
    const calculatedFee = Math.max(route.roundTripMiles * profile.delivery.mileageRate, profile.delivery.minimumCharge ?? 0);
    const { error } = await supabase.from("delivery_route_snapshots").insert({
      calculated_fee: calculatedFee,
      destination_place_id: route.destinationPlaceId,
      distance_meters: route.distanceMeters,
      duration_seconds: route.durationSeconds,
      inquiry_id: body.inquiryId,
      mileage_rate: profile.delivery.mileageRate,
      normalized_destination: route.normalizedDestination,
      provider_response_hash: sha256(route.responseSummary),
      round_trip_miles: route.roundTripMiles,
    });
    if (error) throw error;
    return NextResponse.json({
      calculatedFee: Math.round(calculatedFee * 100) / 100,
      normalizedDestination: route.normalizedDestination,
      roundTripMiles: route.roundTripMiles,
    });
  } catch (error) {
    const code = error instanceof GoogleMapsIntegrationError ? error.code : "delivery-route-failed";
    return NextResponse.json({ error: code }, { status: 502 });
  }
}
