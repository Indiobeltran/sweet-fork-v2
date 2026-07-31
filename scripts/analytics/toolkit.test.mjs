import assert from "node:assert/strict";
import test from "node:test";

import {
  getIntegerOption,
  parseArguments,
  sanitizeGoogleError,
  validateGoogleIdentifiers,
} from "./google-client.mjs";
import {
  desiredCustomDimensions,
  desiredKeyEvent,
  planCustomDimensions,
  planKeyEvent,
  planProperty,
} from "./configure-custom-dimensions.mjs";
import {
  getDateRange,
  getSearchConsolePeriods,
  percentageChange,
} from "./report-utils.mjs";

const validEnvironment = {
  GA4_PROPERTY_ID: "123456789",
  GOOGLE_CLOUD_PROJECT_ID: "sweet-fork-analytics",
  SEARCH_CONSOLE_SITE_URL: "sc-domain:example.com",
};

test("validates supported Google property identifiers", () => {
  assert.deepEqual(validateGoogleIdentifiers(validEnvironment), {
    projectId: "sweet-fork-analytics",
    propertyId: "123456789",
    propertyName: "properties/123456789",
    siteUrl: "sc-domain:example.com",
  });
  assert.equal(
    validateGoogleIdentifiers({
      ...validEnvironment,
      SEARCH_CONSOLE_SITE_URL: "https://www.example.com/",
    }).siteUrl,
    "https://www.example.com/",
  );
  assert.throws(
    () =>
      validateGoogleIdentifiers({
        ...validEnvironment,
        GA4_PROPERTY_ID: "properties/123",
      }),
    /digits only/,
  );
});

test("parses flags and bounded integer options", () => {
  const options = parseArguments([
    "--json",
    "--days=14",
    "--limit",
    "50",
  ]);
  assert.deepEqual(options, { json: true, days: "14", limit: "50" });
  assert.equal(getIntegerOption(options, "limit", 10, { maximum: 100 }), 50);
  assert.throws(
    () => getIntegerOption({ limit: "101" }, "limit", 10, { maximum: 100 }),
    /integer from 1 to 100/,
  );
});

test("builds deterministic reporting periods", () => {
  assert.deepEqual(
    getDateRange({ start: "2026-07-01", end: "2026-07-31" }),
    { startDate: "2026-07-01", endDate: "2026-07-31" },
  );
  assert.deepEqual(
    getSearchConsolePeriods({
      start: "2026-07-01",
      end: "2026-07-28",
    }),
    {
      current: { startDate: "2026-07-01", endDate: "2026-07-28" },
      previous: { startDate: "2026-06-03", endDate: "2026-06-30" },
    },
  );
  assert.equal(percentageChange(150, 100), 50);
  assert.equal(percentageChange(0, 0), 0);
  assert.equal(percentageChange(1, 0), null);
});

test("plans requested dimensions idempotently", () => {
  const existing = desiredCustomDimensions.map((dimension) => ({
    ...dimension,
    archived: false,
    scope: "EVENT",
  }));
  assert.ok(
    planCustomDimensions(existing).every(
      (dimension) => dimension.status === "already_present",
    ),
  );

  const displayMismatch = existing.map((dimension) =>
    dimension.parameterName === "step_name"
      ? { ...dimension, displayName: "Existing Step Name" }
      : dimension,
  );
  assert.equal(
    planCustomDimensions(displayMismatch).find(
      (dimension) => dimension.parameterName === "step_name",
    ).status,
    "display_name_mismatch",
  );

  assert.equal(
    planCustomDimensions([
      existing[0],
      { ...existing[0], displayName: "Duplicate" },
    ])[0].status,
    "duplicate",
  );
});

test("plans generate_lead creation and detects unsafe existing conflicts", () => {
  assert.deepEqual(planKeyEvent([]), {
    ...desiredKeyEvent,
    status: "create",
    existing: [],
  });
  assert.equal(
    planKeyEvent([
      {
        eventName: "generate_lead",
        countingMethod: "ONCE_PER_EVENT",
        defaultValue: null,
      },
    ]).status,
    "already_present",
  );
  assert.equal(
    planKeyEvent([
      {
        eventName: "generate_lead",
        countingMethod: "ONCE_PER_SESSION",
        defaultValue: null,
      },
    ]).status,
    "counting_method_mismatch",
  );
  assert.equal(
    planKeyEvent([
      {
        eventName: "generate_lead",
        countingMethod: "ONCE_PER_EVENT",
        defaultValue: { numericValue: 1, currencyCode: "USD" },
      },
    ]).status,
    "default_value_mismatch",
  );
});

test("plans only the approved property timezone update", () => {
  assert.deepEqual(planProperty({ timeZone: "America/Los_Angeles" }), {
    currentTimeZone: "America/Los_Angeles",
    desiredTimeZone: "America/Denver",
    status: "update",
  });
  assert.equal(
    planProperty({ timeZone: "America/Denver" }).status,
    "already_present",
  );
});

test("sanitizes credential-like material from API errors", () => {
  const sanitized = sanitizeGoogleError(
    new Error(
      'Bearer secret-token "access_token":"abc" -----BEGIN SOMETHING-----material-----END SOMETHING-----',
    ),
  );
  assert.doesNotMatch(sanitized, /secret-token|"abc"|BEGIN SOMETHING/);
});
