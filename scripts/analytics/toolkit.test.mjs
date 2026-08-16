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
import { planLegacyKeyEventRetirement } from "./retire-legacy-key-event.mjs";
import {
  buildSocialSummary,
  classifyLeadRows,
  classifySocialSourceMedium,
} from "./monthly-performance-report.mjs";
import { buildCampaignLink } from "./build-campaign-link.mjs";
import {
  approvedPageviewLeadRuleResource,
  isPageviewToLeadRule,
  planPageviewLeadRuleRetirement,
} from "./retire-pageview-lead-rule.mjs";

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

test("plans only one fixed legacy key-event retirement", () => {
  const propertyName = "properties/123456789";
  const legacy = {
    custom: true,
    deletable: true,
    eventName: "inquiry_submitted",
    name: `${propertyName}/keyEvents/legacy-resource`,
  };

  assert.deepEqual(planLegacyKeyEventRetirement([], propertyName), {
    status: "already_absent",
    resourceName: null,
    existing: [],
  });
  assert.equal(
    planLegacyKeyEventRetirement([legacy], propertyName).status,
    "delete",
  );
  assert.equal(
    planLegacyKeyEventRetirement(
      [legacy, { ...legacy, name: `${propertyName}/keyEvents/duplicate` }],
      propertyName,
    ).status,
    "ambiguous",
  );
  assert.equal(
    planLegacyKeyEventRetirement(
      [{ ...legacy, deletable: false }],
      propertyName,
    ).status,
    "not_deletable",
  );
  assert.equal(
    planLegacyKeyEventRetirement(
      [{ ...legacy, name: "properties/999/keyEvents/wrong-property" }],
      propertyName,
    ).status,
    "invalid_resource_name",
  );
});

test("plans only the approved page-view lead-rule retirement", () => {
  const streamName =
    "properties/504065366/dataStreams/12126159657";
  const approvedRule = {
    name: approvedPageviewLeadRuleResource,
    destinationEvent: "generate_lead",
    sourceCopyParameters: false,
    eventConditions: [
      {
        field: "event_name",
        comparisonType: "EQUALS",
        value: "page_view",
        negated: false,
      },
      {
        field: "page_location",
        comparisonType: "CONTAINS_CASE_INSENSITIVE",
        value: "Thesweetfork.com",
        negated: false,
      },
    ],
    parameterMutations: [],
  };

  assert.deepEqual(planPageviewLeadRuleRetirement([], streamName), {
    status: "already_absent",
    resourceName: null,
    existing: [],
  });
  assert.equal(
    planPageviewLeadRuleRetirement([approvedRule], streamName).status,
    "delete",
  );
  assert.equal(
    planPageviewLeadRuleRetirement(
      [approvedRule, { ...approvedRule, name: `${streamName}/eventCreateRules/other` }],
      streamName,
    ).status,
    "ambiguous",
  );
  assert.equal(
    planPageviewLeadRuleRetirement(
      [{ ...approvedRule, name: `${streamName}/eventCreateRules/wrong` }],
      streamName,
    ).status,
    "invalid_resource_name",
  );
  assert.equal(
    planPageviewLeadRuleRetirement(
      [{ ...approvedRule, sourceCopyParameters: true }],
      streamName,
    ).status,
    "unexpected_rule_shape",
  );
  assert.equal(
    planPageviewLeadRuleRetirement(
      [
        {
          ...approvedRule,
          eventConditions: approvedRule.eventConditions.map((condition) =>
            condition.field === "page_location"
              ? { ...condition, value: "example.com" }
              : condition,
          ),
        },
      ],
      streamName,
    ).status,
    "unexpected_rule_shape",
  );
  assert.equal(isPageviewToLeadRule(approvedRule), true);
  assert.equal(
    isPageviewToLeadRule({ ...approvedRule, destinationEvent: "purchase" }),
    false,
  );
});

test("separates verified inquiry leads from unverified generate_lead events", () => {
  assert.deepEqual(
    classifyLeadRows([
      { formVersion: "inquiry_wizard_v3", leadCount: 2 },
      { formVersion: "(not set)", leadCount: 10 },
    ]).map(({ leadStatus }) => leadStatus),
    ["verified", "unverified"],
  );
});

test("normalizes tagged and referral-only Facebook and Instagram traffic", () => {
  assert.deepEqual(classifySocialSourceMedium("facebook / social"), {
    platform: "facebook",
    attribution: "tagged",
  });
  assert.deepEqual(classifySocialSourceMedium("lm.facebook.com / referral"), {
    platform: "facebook",
    attribution: "untagged",
  });
  assert.equal(classifySocialSourceMedium("google / organic"), null);
  assert.deepEqual(
    buildSocialSummary([
      {
        sourceMedium: "facebook.com / referral",
        sessions: 2,
        totalUsers: 2,
        keyEvents: 0,
      },
      {
        sourceMedium: "m.facebook.com / referral",
        sessions: 3,
        totalUsers: 3,
        keyEvents: 1,
      },
      {
        sourceMedium: "instagram / social",
        sessions: 4,
        totalUsers: 3,
        keyEvents: 2,
      },
    ]),
    [
      {
        platform: "facebook",
        attribution: "untagged",
        sessions: 5,
        totalUsers: 5,
        keyEvents: 1,
      },
      {
        platform: "instagram",
        attribution: "tagged",
        sessions: 4,
        totalUsers: 3,
        keyEvents: 2,
      },
    ],
  );
});

test("builds constrained Sweet Fork social campaign links", () => {
  assert.deepEqual(
    buildCampaignLink({
      platform: "instagram",
      campaign: "2026-08-wedding-cakes",
      placement: "story",
      destination: "https://thesweetfork.com/wedding-cakes",
    }),
    {
      url: "https://thesweetfork.com/wedding-cakes?utm_source=instagram&utm_medium=social&utm_campaign=2026-08-wedding-cakes&utm_content=story",
      platform: "instagram",
      campaign: "2026-08-wedding-cakes",
      placement: "story",
      destination: "https://thesweetfork.com/wedding-cakes",
    },
  );
  assert.throws(
    () =>
      buildCampaignLink({
        platform: "facebook",
        campaign: "August Sale",
        placement: "post",
      }),
    /YYYY-MM/,
  );
  assert.throws(
    () =>
      buildCampaignLink({
        platform: "facebook",
        campaign: "2026-08-cakes",
        placement: "post",
        destination: "https://www.thesweetfork.com/?existing=true",
      }),
    /https:\/\/thesweetfork\.com/,
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
