import { hydrateNetlifyEnvironment } from "./_shared/runtime-env";

import { getIntegrationConfig } from "../../src/lib/integrations/config";
import { sha256 } from "../../src/lib/integrations/crypto";
import { syncGoogleCalendar } from "../../src/lib/integrations/google-calendar-workflow";
import { markWebhookProcessed, recordWebhookReceipt } from "../../src/lib/integrations/repository";

export default async function googleCalendarWebhook(request: Request) {
  hydrateNetlifyEnvironment();
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const config = getIntegrationConfig().googleCalendar;
  const channelId = request.headers.get("x-goog-channel-id");
  const channelToken = request.headers.get("x-goog-channel-token");
  const messageNumber = request.headers.get("x-goog-message-number");
  const resourceId = request.headers.get("x-goog-resource-id");
  const resourceState = request.headers.get("x-goog-resource-state") ?? "unknown";

  if (!config.channelToken || channelToken !== config.channelToken || !channelId || !messageNumber) {
    return new Response("Invalid channel", { status: 403 });
  }

  const eventId = `${channelId}:${messageNumber}`;
  const receipt = await recordWebhookReceipt({
    checksum: sha256(`${eventId}:${resourceId ?? ""}:${resourceState}`),
    entityId: resourceId,
    entityType: "calendar",
    eventId,
    eventType: resourceState,
    provider: "google-calendar",
  });
  if (!receipt || receipt.status === "processed" || receipt.status === "ignored") {
    return new Response(null, { status: 200 });
  }
  if (resourceState === "sync") {
    await markWebhookProcessed("google-calendar", eventId, { status: "ignored" });
    return new Response(null, { status: 200 });
  }

  try {
    await syncGoogleCalendar();
    await markWebhookProcessed("google-calendar", eventId, { status: "processed" });
    return new Response(null, { status: 200 });
  } catch {
    await markWebhookProcessed("google-calendar", eventId, {
      errorCode: "google-calendar-webhook-processing-failed",
      status: "failed",
    }).catch(() => undefined);
    return new Response("Retry later", { status: 500 });
  }
}

export const config = {
  path: "/api/integrations/google-calendar/webhook",
};
