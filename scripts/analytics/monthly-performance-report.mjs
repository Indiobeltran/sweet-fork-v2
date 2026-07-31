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

export async function createMonthlyPerformanceReport(
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
  const [siteSummary, leadBreakdown] = await Promise.all([
    runPaginatedAnalyticsReport(
      data,
      {
        property: config.propertyName,
        dateRanges: [dateRange],
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "keyEvents" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      },
      { maxRows },
    ),
    runPaginatedAnalyticsReport(
      data,
      {
        property: config.propertyName,
        dateRanges: [dateRange],
        dimensions: [
          { name: "sessionSourceMedium" },
          { name: "landingPage" },
          { name: "deviceCategory" },
          { name: "customEvent:product_category" },
          { name: "customEvent:budget_bucket" },
          { name: "customEvent:lead_time_bucket" },
        ],
        metrics: [
          { name: "eventCount" },
          { name: "totalUsers" },
          { name: "sessions" },
        ],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            stringFilter: { matchType: "EXACT", value: "generate_lead" },
          },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      },
      { maxRows },
    ),
  ]);
  const summaryRows = siteSummary.rows.map((row) => ({
    sourceMedium: row.sessionSourceMedium,
    sessions: Number(row.sessions),
    totalUsers: Number(row.totalUsers),
    keyEvents: Number(row.keyEvents),
  }));
  const leadRows = leadBreakdown.rows.map((row) => ({
    sourceMedium: row.sessionSourceMedium,
    landingPage: row.landingPage,
    deviceCategory: row.deviceCategory,
    productCategory: row["customEvent:product_category"],
    budgetBucket: row["customEvent:budget_bucket"],
    leadTimeBucket: row["customEvent:lead_time_bucket"],
    leadCount: Number(row.eventCount),
    leadUsers: Number(row.totalUsers),
    leadSessions: Number(row.sessions),
  }));
  const payload = {
    dateRange,
    siteSummary: summaryRows,
    leadPerformance: leadRows,
    truncated: siteSummary.truncated || leadBreakdown.truncated,
  };

  writeOutput({
    json: options.json === true,
    payload,
    lines: [
      `Monthly performance: ${dateRange.startDate} through ${dateRange.endDate}`,
      "",
      "Site acquisition",
      ...formatRows(summaryRows, [
        { key: "sourceMedium", label: "Source / medium" },
        { key: "sessions", label: "Sessions" },
        { key: "totalUsers", label: "Users" },
        { key: "keyEvents", label: "Key events" },
      ]),
      "",
      "generate_lead performance",
      ...formatRows(leadRows, [
        { key: "sourceMedium", label: "Source / medium" },
        { key: "landingPage", label: "Landing page" },
        { key: "deviceCategory", label: "Device" },
        { key: "productCategory", label: "Product" },
        { key: "budgetBucket", label: "Budget" },
        { key: "leadTimeBucket", label: "Lead time" },
        { key: "leadCount", label: "Leads" },
        { key: "leadUsers", label: "Users" },
        { key: "leadSessions", label: "Sessions" },
      ]),
      payload.truncated ? `Output limited to ${maxRows} rows per section.` : "",
    ].filter((line, index, all) => line || all[index - 1] !== ""),
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => createMonthlyPerformanceReport());
}
