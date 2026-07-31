import {
  createAnalyticsClients,
  formatRows,
  getIntegerOption,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "./google-client.mjs";
import { analyticsRowsToObjects } from "./report-utils.mjs";

const expectedInquiryEvents = new Set([
  "generate_lead",
  "inquiry_back_clicked",
  "inquiry_started",
  "inquiry_step_completed",
  "inquiry_step_viewed",
  "inquiry_submission_error",
  "inquiry_validation_error",
]);

export async function checkRealtimeAnalytics(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const minutes = getIntegerOption(options, "minutes", 29, {
    minimum: 1,
    maximum: 29,
  });
  const config = await loadGoogleConfig();
  const { data } = createAnalyticsClients();
  const [report] = await data.runRealtimeReport({
    property: config.propertyName,
    minuteRanges: [{ startMinutesAgo: minutes, endMinutesAgo: 0 }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: "eventName",
              stringFilter: { matchType: "BEGINS_WITH", value: "inquiry_" },
            },
          },
          {
            filter: {
              fieldName: "eventName",
              stringFilter: { matchType: "EXACT", value: "generate_lead" },
            },
          },
        ],
      },
    },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
  });
  const events = analyticsRowsToObjects(report).map((row) => ({
    eventCount: Number(row.eventCount),
    eventName: row.eventName,
  }));
  const generateLeadCount =
    events.find((event) => event.eventName === "generate_lead")?.eventCount ??
    0;
  const unexpectedEvents = events
    .filter((event) => !expectedInquiryEvents.has(event.eventName))
    .map((event) => event.eventName);
  const payload = {
    windowMinutes: minutes,
    generateLeadCount,
    unexpectedEvents,
    events,
    caveat:
      "Realtime reports may not expose newly registered event-scoped custom parameters immediately.",
  };

  if (options.expectLead === true && generateLeadCount < 1) {
    throw new Error(
      `No generate_lead event appeared in the last ${minutes} minutes.`,
    );
  }
  if (options.expectedCount !== undefined) {
    const expectedCount = getIntegerOption(options, "expectedCount", 1, {
      minimum: 0,
      maximum: 100,
    });
    if (generateLeadCount !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} generate_lead event(s) in the last ${minutes} minutes; found ${generateLeadCount}.`,
      );
    }
  }
  if (options.failOnUnexpected === true && unexpectedEvents.length > 0) {
    throw new Error(
      `Unexpected inquiry event name(s): ${unexpectedEvents.join(", ")}.`,
    );
  }

  writeOutput({
    json: options.json === true,
    payload,
    lines: [
      `GA4 Realtime inquiry events (last ${minutes} minutes)`,
      `generate_lead count: ${generateLeadCount}`,
      `Unexpected inquiry event names: ${unexpectedEvents.join(", ") || "none"}`,
      "",
      ...formatRows(events, [
        { key: "eventName", label: "Event" },
        { key: "eventCount", label: "Count" },
      ]),
      "",
      payload.caveat,
      "This command never submits an inquiry.",
    ],
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => checkRealtimeAnalytics());
}
