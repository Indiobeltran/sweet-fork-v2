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

export async function createValidationDiagnosticsReport(
  argv = process.argv.slice(2),
) {
  const options = parseArguments(argv);
  const dateRange = getDateRange(options);
  const maxRows = getIntegerOption(options, "limit", 1_000, {
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
        { name: "customEvent:step_id" },
        { name: "customEvent:field_id" },
        { name: "customEvent:error_code" },
        { name: "customEvent:form_version" },
        { name: "deviceCategory" },
        { name: "sessionSourceMedium" },
      ],
      metrics: [
        { name: "eventCount" },
        { name: "totalUsers" },
        { name: "sessions" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "EXACT",
            value: "inquiry_validation_error",
          },
        },
      },
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    },
    { maxRows },
  );
  const rows = report.rows.map((row) => ({
    stepId: row["customEvent:step_id"],
    fieldId: row["customEvent:field_id"],
    errorCode: row["customEvent:error_code"],
    formVersion: row["customEvent:form_version"],
    deviceCategory: row.deviceCategory,
    sourceMedium: row.sessionSourceMedium,
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
      `Inquiry validation diagnostics: ${dateRange.startDate} through ${dateRange.endDate}`,
      ...formatRows(rows, [
        { key: "stepId", label: "Step" },
        { key: "fieldId", label: "Field" },
        { key: "errorCode", label: "Error" },
        { key: "formVersion", label: "Form" },
        { key: "deviceCategory", label: "Device" },
        { key: "sourceMedium", label: "Source / medium" },
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
  await runCommand(() => createValidationDiagnosticsReport());
}
