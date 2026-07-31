import "server-only";

import { createHmac } from "node:crypto";

import { constantTimeEqual } from "@/lib/integrations/crypto";
import { getIntegrationConfig } from "@/lib/integrations/config";

export class ResendIntegrationError extends Error {
  readonly code: string;

  constructor(code: string) {
    super("Customer email could not be sent.");
    this.code = code;
  }
}

export async function sendResendEmail(input: {
  html: string;
  idempotencyKey: string;
  subject: string;
  text: string;
  to: string;
}) {
  const config = getIntegrationConfig().resend;
  if (!config.enabled || !config.apiKey || !config.fromEmail) {
    throw new ResendIntegrationError("resend-disabled");
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: config.fromEmail,
      html: input.html,
      subject: input.subject,
      text: input.text,
      to: [input.to],
    }),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    method: "POST",
  });

  if (!response.ok) throw new ResendIntegrationError(`resend-http-${response.status}`);
  const payload = await response.json() as { id?: string };
  if (!payload.id) throw new ResendIntegrationError("resend-message-id-missing");
  return payload.id;
}

function decodeSecret(secret: string) {
  const encoded = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  return Buffer.from(encoded, "base64");
}

export function verifyResendWebhook(input: {
  body: string;
  id: string | null;
  signature: string | null;
  timestamp: string | null;
}) {
  const secret = getIntegrationConfig().resend.webhookSecret;
  if (!secret || !input.id || !input.signature || !input.timestamp) return false;
  const timestamp = Number(input.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 5 * 60) return false;

  const signed = `${input.id}.${input.timestamp}.${input.body}`;
  const expected = createHmac("sha256", decodeSecret(secret)).update(signed).digest("base64");
  return input.signature
    .split(" ")
    .map((part) => part.startsWith("v1,") ? part.slice(3) : part)
    .some((signature) => constantTimeEqual(expected, signature));
}
