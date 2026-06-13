import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { serializeNetlifyFormsPayload, submitNetlifyFormsBridge } from "./netlify-bridge.ts";
import type { InquiryProductItem } from "@/types/domain";

test("serializeNetlifyFormsPayload correctly formats URL-encoded parameters", () => {
  const mockItems: InquiryProductItem[] = [
    {
      productType: "custom-cake",
      quantity: 1,
      servings: 24,
      flavorNotes: "Chocolate",
      designNotes: "Blue icing",
    },
  ];

  const payload = serializeNetlifyFormsPayload({
    inquiryId: "test-uuid-1234",
    referenceCode: "SF-TESTREF",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "801-555-1234",
    eventDate: "2026-08-20",
    eventType: "wedding",
    fulfillmentMethod: "delivery",
    budgetRange: "150-300",
    budgetFlexibility: "moderate",
    additionalNotes: "Some extra notes here",
    orderItems: mockItems,
    origin: "https://sweet-fork-v2.netlify.app",
  });

  const params = new URLSearchParams(payload);

  assert.equal(params.get("form-name"), "inquiry-notification");
  assert.equal(params.get("inquiryId"), "test-uuid-1234");
  assert.equal(params.get("referenceCode"), "SF-TESTREF");
  assert.equal(params.get("name"), "Jane Doe");
  assert.equal(params.get("email"), "jane@example.com");
  assert.equal(params.get("phone"), "801-555-1234");
  assert.equal(params.get("eventDate"), "2026-08-20");
  assert.equal(params.get("eventType"), "wedding");
  assert.equal(params.get("fulfillmentMethod"), "delivery");
  assert.equal(params.get("budgetRange"), "$150 to $300");
  assert.equal(params.get("budgetFlexibility"), "Some flexibility");
  assert.equal(params.get("notes"), "Some extra notes here");
  assert.equal(params.get("items"), "Custom cake: 24 servings");
  assert.equal(
    params.get("adminUrl"),
    "https://sweet-fork-v2.netlify.app/admin/inquiries/test-uuid-1234"
  );
  assert.ok(params.has("submittedAtMountain"));
  assert.ok(params.has("submittedAtUtc"));
});

test("serializeNetlifyFormsPayload includes Mountain Time (MDT/MST) and UTC timestamps", () => {
  const mockItems: InquiryProductItem[] = [
    {
      productType: "custom-cake",
      quantity: 1,
      servings: 24,
    },
  ];

  const baseData = {
    inquiryId: "test-uuid-1234",
    referenceCode: "SF-TESTREF",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "801-555-1234",
    eventDate: "2026-08-20",
    eventType: "wedding",
    fulfillmentMethod: "delivery",
    budgetRange: "150-300" as const,
    budgetFlexibility: "moderate" as const,
    additionalNotes: "Some extra notes here",
    orderItems: mockItems,
    origin: "https://sweet-fork-v2.netlify.app",
  };

  // Test summer date (MDT)
  const summerDate = new Date("2026-06-13T02:14:00.000Z");
  const summerPayload = serializeNetlifyFormsPayload(baseData, summerDate);
  const summerParams = new URLSearchParams(summerPayload);

  assert.equal(summerParams.get("submittedAtUtc"), "2026-06-13T02:14:00.000Z");

  const mountainSummer = summerParams.get("submittedAtMountain") ?? "";
  assert.ok(mountainSummer.includes("Jun 12, 2026"));
  assert.ok(mountainSummer.includes("8:14 PM"));
  assert.ok(
    mountainSummer.includes("MDT") ||
    mountainSummer.includes("GMT-6") ||
    mountainSummer.includes("UTC-6") ||
    mountainSummer.includes("Mountain Daylight Time")
  );

  // Test winter date (MST)
  const winterDate = new Date("2026-12-13T02:14:00.000Z");
  const winterPayload = serializeNetlifyFormsPayload(baseData, winterDate);
  const winterParams = new URLSearchParams(winterPayload);

  assert.equal(winterParams.get("submittedAtUtc"), "2026-12-13T02:14:00.000Z");

  const mountainWinter = winterParams.get("submittedAtMountain") ?? "";
  assert.ok(mountainWinter.includes("Dec 12, 2026"));
  assert.ok(mountainWinter.includes("7:14 PM"));
  assert.ok(
    mountainWinter.includes("MST") ||
    mountainWinter.includes("GMT-7") ||
    mountainWinter.includes("UTC-7") ||
    mountainWinter.includes("Mountain Standard Time")
  );
});

test("submitNetlifyFormsBridge targets /__forms.html and handles successful response", async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl = "";
  let calledMethod = "";
  let calledHeaders: Record<string, string> = {};
  let calledBody = "";

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calledUrl = String(input);
    calledMethod = init?.method ?? "";
    calledHeaders = (init?.headers ?? {}) as Record<string, string>;
    calledBody = String(init?.body ?? "");

    return {
      ok: true,
      status: 200,
      text: async () => "OK",
    } as Response;
  };

  try {
    const success = await submitNetlifyFormsBridge("foo=bar", "https://sweet-fork-v2.netlify.app");
    assert.equal(success, true);
    assert.equal(calledUrl, "https://sweet-fork-v2.netlify.app/__forms.html");
    assert.equal(calledMethod, "POST");
    assert.equal(calledHeaders["Content-Type"], "application/x-www-form-urlencoded");
    assert.equal(calledBody, "foo=bar");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("submitNetlifyFormsBridge handles network failure (fail-soft) without throwing", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new Error("Network connection lost");
  };

  try {
    const success = await submitNetlifyFormsBridge("foo=bar", "https://sweet-fork-v2.netlify.app");
    assert.equal(success, false); // Fail-soft, returns false instead of throwing
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("submitNetlifyFormsBridge handles HTTP error response (fail-soft) without throwing", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 404,
      text: async () => "Not Found",
    } as Response;
  };

  try {
    const success = await submitNetlifyFormsBridge("foo=bar", "https://sweet-fork-v2.netlify.app");
    assert.equal(success, false); // Fail-soft, returns false instead of throwing
  } finally {
    globalThis.fetch = originalFetch;
  }
});
