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

export const verifiedInquiryFormVersion = "inquiry_wizard_v3";

const socialSources = new Map([
  ["facebook", "facebook"],
  ["facebook.com", "facebook"],
  ["m.facebook.com", "facebook"],
  ["l.facebook.com", "facebook"],
  ["lm.facebook.com", "facebook"],
  ["instagram", "instagram"],
  ["instagram.com", "instagram"],
  ["l.instagram.com", "instagram"],
]);

export function classifySocialSourceMedium(sourceMedium) {
  const [rawSource = "", rawMedium = ""] = String(sourceMedium)
    .toLowerCase()
    .split("/")
    .map((value) => value.trim());
  const platform = socialSources.get(rawSource);
  if (!platform) return null;
  if (rawMedium === "social") return { platform, attribution: "tagged" };
  if (rawMedium === "referral") {
    return { platform, attribution: "untagged" };
  }
  return null;
}

export function buildSocialSummary(rows) {
  const totals = new Map();
  for (const row of rows) {
    const classification = classifySocialSourceMedium(row.sourceMedium);
    if (!classification) continue;
    const key = `${classification.platform}:${classification.attribution}`;
    const existing = totals.get(key) ?? {
      ...classification,
      sessions: 0,
      totalUsers: 0,
      keyEvents: 0,
    };
    existing.sessions += Number(row.sessions ?? 0);
    existing.totalUsers += Number(row.totalUsers ?? 0);
    existing.keyEvents += Number(row.keyEvents ?? 0);
    totals.set(key, existing);
  }
  return [...totals.values()].sort((left, right) =>
    `${left.platform}:${left.attribution}`.localeCompare(
      `${right.platform}:${right.attribution}`,
    ),
  );
}

export function classifyLeadRows(rows) {
  return rows.map((row) => ({
    ...row,
    leadStatus:
      row.formVersion === verifiedInquiryFormVersion
        ? "verified"
        : "unverified",
  }));
}

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
    formVersion: row["customEvent:form_version"],
    leadCount: Number(row.eventCount),
    leadUsers: Number(row.totalUsers),
    leadSessions: Number(row.sessions),
  }));
  const classifiedLeadRows = classifyLeadRows(leadRows);
  const verifiedLeadRows = classifiedLeadRows.filter(
    (row) => row.leadStatus === "verified",
  );
  const unverifiedLeadRows = classifiedLeadRows.filter(
    (row) => row.leadStatus === "unverified",
  );
  const socialSummary = buildSocialSummary(summaryRows);
  const payload = {
    dateRange,
    siteSummary: summaryRows,
    socialSummary,
    leadPerformance: classifiedLeadRows,
    verifiedLeadPerformance: verifiedLeadRows,
    unverifiedLeadEvents: unverifiedLeadRows,
    leadSummary: {
      verified: verifiedLeadRows.reduce(
        (sum, row) => sum + row.leadCount,
        0,
      ),
      unverified: unverifiedLeadRows.reduce(
        (sum, row) => sum + row.leadCount,
        0,
      ),
    },
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
      "Social acquisition (normalized)",
      ...formatRows(
        socialSummary,
        [
          { key: "platform", label: "Platform" },
          { key: "attribution", label: "Attribution" },
          { key: "sessions", label: "Sessions" },
          { key: "totalUsers", label: "Users" },
          { key: "keyEvents", label: "Key events" },
        ],
        "No Facebook or Instagram acquisition rows.",
      ),
      "",
      `Verified generate_lead performance (${verifiedInquiryFormVersion}): ${payload.leadSummary.verified}`,
      ...formatRows(verifiedLeadRows, [
        { key: "sourceMedium", label: "Source / medium" },
        { key: "landingPage", label: "Landing page" },
        { key: "deviceCategory", label: "Device" },
        { key: "productCategory", label: "Product" },
        { key: "budgetBucket", label: "Budget" },
        { key: "leadTimeBucket", label: "Lead time" },
        { key: "formVersion", label: "Form version" },
        { key: "leadCount", label: "Leads" },
        { key: "leadUsers", label: "Users" },
        { key: "leadSessions", label: "Sessions" },
      ], "No verified generate_lead events."),
      "",
      `Unverified generate_lead events: ${payload.leadSummary.unverified}`,
      ...formatRows(unverifiedLeadRows, [
        { key: "sourceMedium", label: "Source / medium" },
        { key: "landingPage", label: "Landing page" },
        { key: "deviceCategory", label: "Device" },
        { key: "formVersion", label: "Form version" },
        { key: "leadCount", label: "Events" },
        { key: "leadUsers", label: "Users" },
        { key: "leadSessions", label: "Sessions" },
      ], "No unverified generate_lead events."),
      payload.truncated ? `Output limited to ${maxRows} rows per section.` : "",
    ].filter((line, index, all) => line || all[index - 1] !== ""),
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => createMonthlyPerformanceReport());
}
