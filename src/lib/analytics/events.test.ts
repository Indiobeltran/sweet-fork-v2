import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { INQUIRY_FORM_VERSION, buildAnalyticsEventPayload, consumeInquiryStarted, consumeInquiryStepCompleted, consumeInquiryStepViewed, createInquiryAnalyticsSession, emitGenerateLeadAfterPersistence, getAnalyticsRuntimeState, getBudgetBucket, getInquiryFieldId, getInquiryValidationErrorCode, getLeadTimeBucket, getProductCategory, isAnalyticsEventName } from "./events.ts";

describe("analytics event allowlist", () => {
  it("accepts approved phase 1 events and rejects unknown names", () => {
    assert.equal(isAnalyticsEventName("generate_lead"), true);
    assert.equal(isAnalyticsEventName("inquiry_back_clicked"), true);
    assert.equal(isAnalyticsEventName("gallery_item_viewed"), true);
    assert.equal(isAnalyticsEventName("inquiry_submitted"), false);
    assert.equal(isAnalyticsEventName("inquiry_step_back"), false);
    assert.equal(isAnalyticsEventName("form_submit"), false);
    assert.equal(isAnalyticsEventName("customer_email_captured"), false);
  });

  it("keeps only approved parameter keys and safe values", () => {
    const payload = buildAnalyticsEventPayload("generate_lead", {
      budget_bucket: "250_500",
      customer_email: "customer@example.com",
      customerName: "Melissa",
      design_notes: "sage buttercream with private customer wording",
      event_date: "2026-07-18",
      filename: "private-inspiration.jpg",
      form_version: INQUIRY_FORM_VERSION,
      has_inspiration_images: true,
      inquiry_id: "abc-123",
      page_path: "/start-order",
      phone: "801-555-1234",
      selected_product_count: 2,
    });

    assert.deepEqual(payload, {
      eventName: "generate_lead",
      params: {
        budget_bucket: "250_500",
        form_version: INQUIRY_FORM_VERSION,
        has_inspiration_images: true,
        page_path: "/start-order",
        selected_product_count: 2,
      },
    });
  });

  it("rejects arbitrary strings in inquiry contract parameters", () => {
    const payload = buildAnalyticsEventPayload("inquiry_validation_error", {
      error_code: "customer@example.com",
      field_id: "customer@example.com",
      form_version: "customer supplied version",
      step_id: "private event notes",
      step_name: "private event notes",
    });

    assert.deepEqual(payload, {
      eventName: "inquiry_validation_error",
      params: {},
    });
  });

  it("returns null for unknown events", () => {
    assert.equal(
      buildAnalyticsEventPayload("signup" as never, { page_path: "/start-order" }),
      null,
    );
  });
});

describe("inquiry analytics contract", () => {
  it("uses stable field IDs and error codes without including invalid values", () => {
    assert.equal(
      getInquiryFieldId("orderItems.12.flavorNotes"),
      "order_items_flavor_notes",
    );
    assert.equal(getInquiryFieldId("customerEmail"), "customer_email");
    assert.equal(
      getInquiryValidationErrorCode(
        "customer_email",
        "Enter a valid email address.",
      ),
      "invalid_format",
    );
    assert.equal(
      getInquiryValidationErrorCode(
        "event_date",
        "Event date cannot be in the past.",
      ),
      "past_date",
    );
    assert.equal(
      getInquiryValidationErrorCode(
        "delivery_zip",
        "Delivery requests need a ZIP code.",
      ),
      "required",
    );
  });

  it("records started, viewed, and completed milestones once per inquiry session", () => {
    const session = createInquiryAnalyticsSession();

    assert.equal(consumeInquiryStarted(session), true);
    assert.equal(consumeInquiryStarted(session), false);
    assert.equal(consumeInquiryStepViewed(session, "event_details"), true);
    assert.equal(consumeInquiryStepViewed(session, "event_details"), false);
    assert.equal(
      consumeInquiryStepCompleted(session, "event_details"),
      true,
    );
    assert.equal(
      consumeInquiryStepCompleted(session, "event_details"),
      false,
    );
  });
});

describe("generate_lead persistence contract", () => {
  function createRecorder() {
    const events: Array<{
      eventName: string;
      params: Record<string, unknown> | undefined;
    }> = [];

    return {
      emit: (
        eventName: Parameters<typeof buildAnalyticsEventPayload>[0],
        params?: Record<string, unknown>,
      ) => {
        events.push({ eventName, params });
      },
      events,
    };
  }

  it("emits generate_lead once after successful persistence confirmation", () => {
    const session = createInquiryAnalyticsSession();
    const recorder = createRecorder();
    const confirmation = {
      inquiryId: "private-database-id",
      persisted: true,
      referenceCode: "SF-PRIVATE",
    };

    assert.equal(
      emitGenerateLeadAfterPersistence({
        confirmation,
        emit: recorder.emit,
        params: {
          product_category: "custom_cakes",
          selected_product_count: 1,
        },
        session,
      }),
      true,
    );

    assert.deepEqual(recorder.events, [
      {
        eventName: "generate_lead",
        params: {
          form_version: INQUIRY_FORM_VERSION,
          product_category: "custom_cakes",
          selected_product_count: 1,
        },
      },
    ]);
    assert.equal(
      JSON.stringify(recorder.events).includes("private-database-id"),
      false,
    );
    assert.equal(
      JSON.stringify(recorder.events).includes("SF-PRIVATE"),
      false,
    );
  });

  it("emits no generate_lead after failed persistence", () => {
    const session = createInquiryAnalyticsSession();
    const recorder = createRecorder();

    assert.equal(
      emitGenerateLeadAfterPersistence({
        confirmation: { error: "persistence failed" },
        emit: recorder.emit,
        params: { product_category: "custom_cakes" },
        session,
      }),
      false,
    );
    assert.deepEqual(recorder.events, []);
  });

  it("does not duplicate generate_lead across repeated calls or rerenders", () => {
    const session = createInquiryAnalyticsSession();
    const recorder = createRecorder();
    const confirmation = {
      inquiryId: "confirmed-id",
      persisted: true,
      referenceCode: "SF-CONFIRMED",
    };

    for (let render = 0; render < 3; render += 1) {
      emitGenerateLeadAfterPersistence({
        confirmation,
        emit: recorder.emit,
        params: { product_category: "multiple" },
        session,
      });
    }

    assert.equal(recorder.events.length, 1);
  });

  it("allows a failed attempt to retry and later emit generate_lead once", () => {
    const session = createInquiryAnalyticsSession();
    const recorder = createRecorder();

    emitGenerateLeadAfterPersistence({
      confirmation: null,
      emit: recorder.emit,
      params: { product_category: "cupcakes" },
      session,
    });
    emitGenerateLeadAfterPersistence({
      confirmation: {
        inquiryId: "confirmed-id",
        persisted: true,
        referenceCode: "SF-CONFIRMED",
      },
      emit: recorder.emit,
      params: { product_category: "cupcakes" },
      session,
    });
    emitGenerateLeadAfterPersistence({
      confirmation: {
        inquiryId: "confirmed-id",
        persisted: true,
        referenceCode: "SF-CONFIRMED",
      },
      emit: recorder.emit,
      params: { product_category: "cupcakes" },
      session,
    });

    assert.equal(recorder.events.length, 1);
    assert.equal(recorder.events[0]?.eventName, "generate_lead");
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
