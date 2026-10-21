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
import {
  getAnalyticsReportingPeriod,
  productionHostFilter,
  productionHostname,
  runPaginatedAnalyticsReport,
} from "./report-utils.mjs";

const funnelEvents = [
  "inquiry_started",
  "inquiry_step_completed",
  "generate_lead",
];

export async function createInquiryFunnelReport(
  argv = process.argv.slice(2),
  dependencies = {},
) {
  const options = parseArguments(argv);
  const maxRows = getIntegerOption(options, "limit", 500, {
    minimum: 1,
    maximum: 10_000,
  });
  const config = await (dependencies.loadConfig ?? loadGoogleConfig)();
  const { admin, data } = (dependencies.createClients ?? createAnalyticsClients)();
  const { dateRange, timeZone } = await getAnalyticsReportingPeriod(
    admin,
    config.propertyName,
    options,
    dependencies.now,
  );
  const report = await runPaginatedAnalyticsReport(
    data,
    {
      property: config.propertyName,
      dateRanges: [dateRange],
      dimensions: [
        { name: "eventName" },
        { name: "customEvent:step_id" },
        { name: "customEvent:step_name" },
        { name: "customEvent:form_version" },
      ],
      metrics: [
        { name: "eventCount" },
        { name: "totalUsers" },
        { name: "sessions" },
      ],
      dimensionFilter: productionHostFilter({
        filter: {
          fieldName: "eventName",
          inListFilter: { values: funnelEvents },
        },
      }),
      orderBys: [
        { dimension: { dimensionName: "eventName" } },
        { dimension: { dimensionName: "customEvent:step_id" } },
      ],
    },
    { maxRows },
  );
  const rows = report.rows.map((row) => ({
    eventName: row.eventName,
    stepId: row["customEvent:step_id"],
    stepName: row["customEvent:step_name"],
    formVersion: row["customEvent:form_version"],
    eventCount: Number(row.eventCount),
    totalUsers: Number(row.totalUsers),
    sessions: Number(row.sessions),
  }));
  const payload = {
    dateRange,
    timeZone,
    hostname: productionHostname,
    measurement: "event_and_step_counts",
    sequenced: false,
    interpretation:
      "Independent event and step aggregates; not a sequenced funnel or abandonment rate. Use a GA4 Funnel Exploration for ordered progression.",
    rows,
    rowCount: report.rowCount,
    truncated: report.truncated,
  };

  (dependencies.writeOutput ?? writeOutput)({
    json: options.json === true,
    payload,
    lines: [
      `Inquiry event and step counts: ${dateRange.startDate} through ${dateRange.endDate}`,
      `Production hostname: ${productionHostname}; property timezone: ${timeZone}`,
      payload.interpretation,
      ...formatRows(rows, [
        { key: "eventName", label: "Event" },
        { key: "stepId", label: "Step ID" },
        { key: "stepName", label: "Step name" },
        { key: "formVersion", label: "Form version" },
        { key: "eventCount", label: "Events" },
        { key: "totalUsers", label: "Users" },
        { key: "sessions", label: "Sessions" },
      ]),
      report.truncated ? `Output limited to ${maxRows} rows.` : "",
    ].filter(Boolean),
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => createInquiryFunnelReport());
}
