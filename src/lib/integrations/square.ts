import "server-only";

import { constantTimeEqual, hmacSha256Base64 } from "@/lib/integrations/crypto";
import { getIntegrationConfig } from "@/lib/integrations/config";
import { getBusinessDateKey } from "@/lib/business-time";
export { moneyToCents, squareIdempotencyKey } from "@/lib/integrations/square-utils";

type SquareErrorPayload = {
  errors?: Array<{ category?: string; code?: string; detail?: string }>;
};

export class SquareIntegrationError extends Error {
  readonly code: string;

  constructor(
    code: string,
    message = "Square could not complete the request.",
  ) {
    super(message);
    this.code = code;
  }
}

function squareBaseUrl() {
  return getIntegrationConfig().square.mode === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

export function verifySquareWebhook(rawBody: string, signature: string | null) {
  const config = getIntegrationConfig().square;

  if (!signature || !config.webhookNotificationUrl || !config.webhookSignatureKey) {
    return false;
  }

  const expected = hmacSha256Base64(
    config.webhookSignatureKey,
    `${config.webhookNotificationUrl}${rawBody}`,
  );

  return constantTimeEqual(expected, signature);
}

export async function squareRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getIntegrationConfig().square;

  if (!config.enabled || !config.accessToken || !config.locationId) {
    throw new SquareIntegrationError("square-disabled");
  }

  const response = await fetch(`${squareBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2026-05-20",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as SquareErrorPayload;
    const providerCode = payload.errors?.[0]?.code;
    throw new SquareIntegrationError(
      providerCode ? `square-${providerCode.toLowerCase()}` : `square-http-${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export type SquareInvoice = {
  id: string;
  invoice_number?: string;
  order_id: string;
  payment_requests?: Array<{
    computed_amount_money?: { amount?: number };
    request_type?: "BALANCE" | "DEPOSIT" | "INSTALLMENT";
    total_completed_amount_money?: { amount?: number };
  }>;
  public_url?: string;
  status?: string;
  version: number;
};

export type SquarePayment = {
  amount_money?: { amount?: number; currency?: string };
  created_at?: string;
  id: string;
  order_id?: string;
  refunded_money?: { amount?: number; currency?: string };
  status?: string;
  updated_at?: string;
};

export async function findSquareCustomerByEmail(email: string) {
  const result = await squareRequest<{ customers?: Array<{ id: string }> }>(
    "/v2/customers/search",
    {
      body: JSON.stringify({
        limit: 1,
        query: { filter: { email_address: { exact: email } } },
      }),
      method: "POST",
    },
  );

  return result.customers?.[0] ?? null;
}

export async function createSquareCustomer(input: {
  email: string;
  idempotencyKey: string;
  name: string;
  phone?: string | null;
  referenceId: string;
}) {
  const [givenName, ...familyParts] = input.name.trim().split(/\s+/);
  const result = await squareRequest<{ customer: { id: string } }>("/v2/customers", {
    body: JSON.stringify({
      email_address: input.email,
      family_name: familyParts.join(" ") || undefined,
      given_name: givenName,
      idempotency_key: input.idempotencyKey,
      phone_number: input.phone || undefined,
      reference_id: input.referenceId,
    }),
    method: "POST",
  });

  return result.customer;
}

export async function createSquareOrder(input: {
  customerId: string;
  idempotencyKey: string;
  note: string;
  referenceId: string;
  totalCents: number;
}) {
  const config = getIntegrationConfig().square;
  const result = await squareRequest<{ order: { id: string; version?: number } }>("/v2/orders", {
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      order: {
        customer_id: input.customerId,
        line_items: [
          {
            base_price_money: { amount: input.totalCents, currency: "USD" },
            name: input.note,
            quantity: "1",
          },
        ],
        location_id: config.locationId,
        reference_id: input.referenceId,
      },
    }),
    method: "POST",
  });

  return result.order;
}

export async function createSquareInvoice(input: {
  balanceDueDate: string;
  customerId: string;
  depositCents: number;
  idempotencyKey: string;
  invoiceNumber: string;
  orderId: string;
  title: string;
  totalCents: number;
}) {
  const config = getIntegrationConfig().square;
  const paymentRequests = input.depositCents > 0 && input.depositCents < input.totalCents
    ? [
        {
          automatic_payment_source: "NONE",
          due_date: getBusinessDateKey(new Date()),
          fixed_amount_requested_money: { amount: input.depositCents, currency: "USD" },
          request_type: "DEPOSIT",
        },
        {
          automatic_payment_source: "NONE",
          due_date: input.balanceDueDate,
          request_type: "BALANCE",
        },
      ]
    : [
        {
          automatic_payment_source: "NONE",
          due_date: input.balanceDueDate,
          request_type: "BALANCE",
        },
      ];
  const result = await squareRequest<{ invoice: SquareInvoice }>("/v2/invoices", {
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      invoice: {
        accepted_payment_methods: {
          bank_account: false,
          buy_now_pay_later: false,
          card: true,
          cash_app_pay: true,
          square_gift_card: false,
        },
        delivery_method: "EMAIL",
        invoice_number: input.invoiceNumber,
        location_id: config.locationId,
        order_id: input.orderId,
        payment_requests: paymentRequests,
        primary_recipient: { customer_id: input.customerId },
        title: input.title,
      },
    }),
    method: "POST",
  });

  return result.invoice;
}

export async function publishSquareInvoice(invoice: SquareInvoice, idempotencyKey: string) {
  const result = await squareRequest<{ invoice: SquareInvoice }>(
    `/v2/invoices/${encodeURIComponent(invoice.id)}/publish`,
    {
      body: JSON.stringify({ idempotency_key: idempotencyKey, version: invoice.version }),
      method: "POST",
    },
  );

  return result.invoice;
}

export async function getSquareInvoice(invoiceId: string) {
  const result = await squareRequest<{ invoice: SquareInvoice }>(
    `/v2/invoices/${encodeURIComponent(invoiceId)}`,
  );
  return result.invoice;
}

export async function listSquarePayments(orderId: string) {
  const params = new URLSearchParams({ order_id: orderId });
  const result = await squareRequest<{ payments?: SquarePayment[] }>(`/v2/payments?${params}`);
  return result.payments ?? [];
}
