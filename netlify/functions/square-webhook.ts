import { hydrateNetlifyEnvironment } from "./_shared/runtime-env";

import { sha256 } from "../../src/lib/integrations/crypto";
import {
  markWebhookProcessed,
  recordWebhookReceipt,
} from "../../src/lib/integrations/repository";
import { verifySquareWebhook } from "../../src/lib/integrations/square";
import { reconcileSquareInvoice } from "../../src/lib/integrations/square-workflow";

type SquareWebhookPayload = {
  created_at?: string;
  data?: {
    object?: {
      invoice?: { id?: string };
    };
    type?: string;
  };
  event_id?: string;
  merchant_id?: string;
  type?: string;
};

export default async function squareWebhook(request: Request) {
  hydrateNetlifyEnvironment();

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");
  if (!verifySquareWebhook(rawBody, signature)) {
    return new Response("Invalid signature", { status: 403 });
  }

  let payload: SquareWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SquareWebhookPayload;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const eventId = payload.event_id?.trim();
  const eventType = payload.type?.trim();
  if (!eventId || !eventType) {
    return new Response("Invalid event", { status: 400 });
  }

  const invoiceId = payload.data?.object?.invoice?.id ?? null;
  const receipt = await recordWebhookReceipt({
    checksum: sha256(rawBody),
    entityId: invoiceId,
    entityType: invoiceId ? "invoice" : payload.data?.type ?? null,
    eventId,
    eventType,
    occurredAt: payload.created_at ?? null,
    provider: "square",
  });

  if (!receipt || receipt.status === "processed" || receipt.status === "ignored") {
    return new Response(null, { status: 200 });
  }

  if (!invoiceId) {
    await markWebhookProcessed("square", eventId, { status: "ignored" });
    return new Response(null, { status: 200 });
  }

  try {
    await reconcileSquareInvoice(invoiceId);
    await markWebhookProcessed("square", eventId, { status: "processed" });
    return new Response(null, { status: 200 });
  } catch {
    await markWebhookProcessed("square", eventId, {
      errorCode: "square-webhook-processing-failed",
      status: "failed",
    }).catch(() => undefined);
    return new Response("Retry later", { status: 500 });
  }
}

export const config = {
  path: "/api/integrations/square/webhook",
};
