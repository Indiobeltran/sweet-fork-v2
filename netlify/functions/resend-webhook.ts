import { hydrateNetlifyEnvironment } from "./_shared/runtime-env";

import { sha256 } from "../../src/lib/integrations/crypto";
import { markWebhookProcessed, recordWebhookReceipt } from "../../src/lib/integrations/repository";
import { verifyResendWebhook } from "../../src/lib/integrations/resend";
import { createAdminClient } from "../../src/lib/supabase/admin";

type ResendWebhookPayload = {
  created_at?: string;
  data?: { email_id?: string };
  type?: string;
};

export default async function resendWebhook(request: Request) {
  hydrateNetlifyEnvironment();
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!verifyResendWebhook({ body, id, signature, timestamp })) {
    return new Response("Invalid signature", { status: 403 });
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(body) as ResendWebhookPayload;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
  if (!id || !payload.type) return new Response("Invalid event", { status: 400 });
  const messageId = payload.data?.email_id ?? null;
  const receipt = await recordWebhookReceipt({
    checksum: sha256(body),
    entityId: messageId,
    entityType: "email",
    eventId: id,
    eventType: payload.type,
    occurredAt: payload.created_at ?? null,
    provider: "resend",
  });
  if (!receipt || receipt.status === "processed") return new Response(null, { status: 200 });

  try {
    if (messageId) {
      const supabase = createAdminClient();
      const failureTypes = ["email.bounced", "email.complained", "email.failed", "email.suppressed"];
      const { error } = await supabase
        .from("notification_logs")
        .update({
          error_message: failureTypes.includes(payload.type) ? payload.type : null,
          status: failureTypes.includes(payload.type) ? "failed" : "sent",
        })
        .contains("response_json", { providerMessageId: messageId });
      if (error) throw error;
    }
    await markWebhookProcessed("resend", id, { status: "processed" });
    return new Response(null, { status: 200 });
  } catch {
    await markWebhookProcessed("resend", id, {
      errorCode: "resend-webhook-processing-failed",
      status: "failed",
    }).catch(() => undefined);
    return new Response("Retry later", { status: 500 });
  }
}

export const config = {
  path: "/api/integrations/resend/webhook",
};
