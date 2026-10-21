import assert from "node:assert/strict";
import test from "node:test";

import { validateInspectionUrl } from "./url-inspection.mjs";
import {
  createSearchPerformanceReport,
  summarizeSearchConsoleTotalRows,
} from "./search-performance-report.mjs";

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

test("report requests final web property totals separately from capped breakdowns", async () => {
  const requests = [];
  const outputs = [];
  const currentTotal = { clicks: 90, impressions: 1895, ctr: 90 / 1895, position: 11.5 };
  const previousTotal = { clicks: 76, impressions: 2503, ctr: 76 / 2503, position: 12.4 };
  const result = await createSearchPerformanceReport([
    "--start", "2026-09-20", "--end", "2026-10-17", "--limit", "1", "--json",
  ], {
    loadConfig: async () => ({ siteUrl: "sc-domain:thesweetfork.com" }),
    createClient: () => ({
      searchanalytics: {
        query: async (request) => {
          requests.push(request);
          const { requestBody } = request;
          if (requestBody.dimensions.length === 0) {
            return { data: { rows: [requestBody.startDate === "2026-09-20" ? currentTotal : previousTotal] } };
          }
          return { data: { rows: [{ keys: ["example"], clicks: 2, impressions: 10, ctr: 0.2, position: 5 }] } };
        },
      },
    }),
    writeOutput: (output) => outputs.push(output),
  });
  const totalRequests = requests.filter(({ requestBody }) => requestBody.dimensions.length === 0);
  assert.equal(totalRequests.length, 2);
  for (const request of totalRequests) {
    assert.equal(request.siteUrl, "sc-domain:thesweetfork.com");
    assert.deepEqual(request.requestBody, {
      ...(request.requestBody.startDate === "2026-09-20"
        ? { startDate: "2026-09-20", endDate: "2026-10-17" }
        : { startDate: "2026-08-23", endDate: "2026-09-19" }),
      dimensions: [],
      type: "web",
      dataState: "final",
      aggregationType: "byProperty",
      rowLimit: 1,
    });
  }
  const breakdownRequests = requests.filter(({ requestBody }) => requestBody.dimensions.length > 0);
  assert.equal(breakdownRequests.length, 3);
  for (const { requestBody } of breakdownRequests) {
    assert.equal(requestBody.type, "web");
    assert.equal(requestBody.dataState, "final");
    assert.equal(requestBody.rowLimit, 1);
    assert.equal(requestBody.startRow, 0);
  }
  assert.deepEqual(result.currentSummary, currentTotal);
  assert.deepEqual(result.previousSummary, previousTotal);
  assert.equal(result.queries[0].clicks, 2);
  assert.equal(result.landingPages[0].clicks, 2);
  assert.deepEqual(result.truncation, { currentQueries: true, currentPages: true, previousQueries: true });
  assert.equal(result.truncated, true);
  assert.match(outputs[0].lines.join("\n"), /Clicks: 90/);
});
