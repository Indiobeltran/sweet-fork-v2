import "server-only";

import { getIntegrationConfig } from "@/lib/integrations/config";

export class GoogleMapsIntegrationError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, status?: number) {
    super(code);
    this.code = code;
    this.status = status;
    this.name = "GoogleMapsIntegrationError";
  }
}

async function mapsRequest<T>(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null) as T | null;
  if (!response.ok || !body) throw new GoogleMapsIntegrationError("google-maps-request-failed", response.status);
  return body;
}

export async function calculateDeliveryRoute(destination: string) {
  const config = getIntegrationConfig().googleMaps;
  if (!config.enabled || !config.apiKey || !config.bakeryOrigin) {
    throw new GoogleMapsIntegrationError("google-maps-disabled");
  }

  const validation = await mapsRequest<{
    result?: { address?: { formattedAddress?: string }; geocode?: { placeId?: string } };
  }>(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(config.apiKey)}`, {
    body: JSON.stringify({ address: { addressLines: [destination], regionCode: "US" } }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const normalizedDestination = validation.result?.address?.formattedAddress?.trim();
  if (!normalizedDestination) throw new GoogleMapsIntegrationError("delivery-address-invalid");

  const route = await mapsRequest<{
    routes?: Array<{ distanceMeters?: number; duration?: string }>;
  }>("https://routes.googleapis.com/directions/v2:computeRoutes", {
    body: JSON.stringify({
      destination: { address: normalizedDestination },
      origin: { address: config.bakeryOrigin },
      routingPreference: "TRAFFIC_UNAWARE",
      travelMode: "DRIVE",
    }),
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": config.apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    method: "POST",
  });
  const first = route.routes?.[0];
  if (!first?.distanceMeters) throw new GoogleMapsIntegrationError("delivery-route-not-found");

  return {
    destinationPlaceId: validation.result?.geocode?.placeId ?? null,
    distanceMeters: first.distanceMeters,
    durationSeconds: first.duration ? Math.round(Number.parseFloat(first.duration)) : null,
    normalizedDestination,
    roundTripMiles: Math.round((first.distanceMeters * 2 / 1609.344) * 100) / 100,
    responseSummary: JSON.stringify({ distanceMeters: first.distanceMeters, duration: first.duration ?? null }),
  };
}
