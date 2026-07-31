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
  getDateRange,
  runPaginatedAnalyticsReport,
} from "./report-utils.mjs";

const funnelEvents = [
  "inquiry_started",
  "inquiry_step_completed",
  "generate_lead",
];

export async function createInquiryFunnelReport(
  argv = process.argv.slice(2),
) {
  const options = parseArguments(argv);
  const dateRange = getDateRange(options);
  const maxRows = getIntegerOption(options, "limit", 500, {
    minimum: 1,
    maximum: 10_000,
  });
  const config = await loadGoogleConfig();
  const { data } = createAnalyticsClients();
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
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: funnelEvents },
        },
      },
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
    rows,
    rowCount: report.rowCount,
    truncated: report.truncated,
  };

  writeOutput({
    json: options.json === true,
    payload,
    lines: [
      `Inquiry funnel: ${dateRange.startDate} through ${dateRange.endDate}`,
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
