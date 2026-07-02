import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { buildAnalyticsEventPayload, getAnalyticsRuntimeState, getBudgetBucket, getLeadTimeBucket, getProductCategory, isAnalyticsEventName } from "./events.ts";

describe("analytics event allowlist", () => {
  it("accepts approved phase 1 events and rejects unknown names", () => {
    assert.equal(isAnalyticsEventName("inquiry_submitted"), true);
    assert.equal(isAnalyticsEventName("gallery_item_viewed"), true);
    assert.equal(isAnalyticsEventName("form_submit"), false);
    assert.equal(isAnalyticsEventName("customer_email_captured"), false);
  });

  it("keeps only approved parameter keys and safe values", () => {
    const payload = buildAnalyticsEventPayload("inquiry_submitted", {
      budget_bucket: "250_500",
      customer_email: "customer@example.com",
      customerName: "Melissa",
      event_date: "2026-07-18",
      has_inspiration_images: true,
      inquiry_id: "abc-123",
      page_path: "/start-order",
      selected_product_count: 2,
      step_number: 5,
    });

    assert.deepEqual(payload, {
      eventName: "inquiry_submitted",
      params: {
        budget_bucket: "250_500",
        has_inspiration_images: true,
        page_path: "/start-order",
        selected_product_count: 2,
        step_number: 5,
      },
    });
  });

  it("returns null for unknown events", () => {
    assert.equal(
      buildAnalyticsEventPayload("signup" as never, { page_path: "/start-order" }),
      null,
    );
  });
});

describe("analytics runtime gates", () => {
  it("enables tracking only on the canonical public production host", () => {
    assert.deepEqual(
      getAnalyticsRuntimeState({
        hostname: "thesweetfork.com",
        measurementId: "G-3FG4VD58VP",
        nodeEnv: "production",
        pathname: "/gallery",
      }),
      { enabled: true, reason: "enabled" },
    );
  });

  it("disables tracking without an id, on localhost, on Netlify hosts, and on admin paths", () => {
    assert.equal(
      getAnalyticsRuntimeState({
        hostname: "thesweetfork.com",
        measurementId: "",
        nodeEnv: "production",
        pathname: "/",
      }).reason,
      "missing_measurement_id",
    );
    assert.equal(
      getAnalyticsRuntimeState({
        hostname: "localhost",
        measurementId: "G-3FG4VD58VP",
        nodeEnv: "production",
        pathname: "/",
      }).reason,
      "local_host",
    );
    assert.equal(
      getAnalyticsRuntimeState({
        hostname: "sweet-fork-v2.netlify.app",
        measurementId: "G-3FG4VD58VP",
        nodeEnv: "production",
        pathname: "/",
      }).reason,
      "preview_or_temporary_host",
    );
    assert.equal(
      getAnalyticsRuntimeState({
        hostname: "thesweetfork.com",
        measurementId: "G-3FG4VD58VP",
        nodeEnv: "production",
        pathname: "/admin/login",
      }).reason,
      "admin_path",
    );
  });
});

describe("analytics bucketing helpers", () => {
  it("maps product types and budget ranges to reporting-safe values", () => {
    assert.equal(getProductCategory("custom-cake"), "custom_cakes");
    assert.equal(getProductCategory("wedding-cake"), "wedding_cakes");
    assert.equal(getBudgetBucket("150-300"), "150_300");
    assert.equal(getBudgetBucket("2000-plus"), "2000_plus");
  });

  it("buckets lead time without exposing exact event dates", () => {
    assert.equal(getLeadTimeBucket("2026-07-07", new Date("2026-07-02T12:00:00-06:00")), "under_2_weeks");
    assert.equal(getLeadTimeBucket("2026-07-25", new Date("2026-07-02T12:00:00-06:00")), "2_4_weeks");
    assert.equal(getLeadTimeBucket("2026-08-20", new Date("2026-07-02T12:00:00-06:00")), "over_4_weeks");
    assert.equal(getLeadTimeBucket("", new Date("2026-07-02T12:00:00-06:00")), "unknown");
  });
});
