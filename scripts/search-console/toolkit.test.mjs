import assert from "node:assert/strict";
import test from "node:test";

import { validateInspectionUrl } from "./url-inspection.mjs";
import { summarizeSearchConsoleTotalRows } from "./search-performance-report.mjs";

test("accepts URLs inside a domain Search Console property", () => {
  assert.equal(
    validateInspectionUrl(
      "sc-domain:example.com",
      "https://www.example.com/start-order",
    ),
    "https://www.example.com/start-order",
  );
  assert.throws(
    () =>
      validateInspectionUrl(
        "sc-domain:example.com",
        "https://example.net/start-order",
      ),
    /does not belong/,
  );
});

test("enforces HTTPS and URL-prefix boundaries", () => {
  assert.throws(
    () =>
      validateInspectionUrl(
        "sc-domain:example.com",
        "http://example.com/start-order",
      ),
    /must use HTTPS/,
  );
  assert.equal(
    validateInspectionUrl(
      "https://www.example.com/",
      "https://www.example.com/start-order",
    ),
    "https://www.example.com/start-order",
  );
  assert.throws(
    () =>
      validateInspectionUrl(
        "https://www.example.com/",
        "https://www.example.com.evil.invalid/",
      ),
    /does not belong/,
  );
});

test("uses the ungrouped Search Console total instead of capped table rows", () => {
  const cappedQueryRows = [
    { clicks: 3, impressions: 30, ctr: 0.1, position: 2 },
    { clicks: 2, impressions: 20, ctr: 0.1, position: 4 },
  ];
  const completeTotalRows = [
    { clicks: 19, impressions: 500, ctr: 0.038, position: 8.4 },
  ];

  assert.equal(
    cappedQueryRows.reduce((sum, row) => sum + row.clicks, 0),
    5,
  );
  assert.deepEqual(summarizeSearchConsoleTotalRows(completeTotalRows), {
    clicks: 19,
    impressions: 500,
    ctr: 0.038,
    position: 8.4,
  });
  assert.deepEqual(summarizeSearchConsoleTotalRows([]), {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
  });
});
