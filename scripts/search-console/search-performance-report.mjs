import {
  createSearchConsoleClient,
  formatRows,
  getIntegerOption,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "../analytics/google-client.mjs";
import {
  getSearchConsolePeriods,
  percentageChange,
  querySearchConsoleRows,
} from "../analytics/report-utils.mjs";

export function summarizeSearchConsoleTotalRows(rows) {
  const row = rows[0] ?? {};
  return {
    clicks: Number(row.clicks ?? 0),
    impressions: Number(row.impressions ?? 0),
    ctr: Number(row.ctr ?? 0),
    position: Number(row.position ?? 0),
  };
}

function publicRows(rows, dimensionName) {
  return rows.map((row) => ({
    [dimensionName]: row.keys?.[0] ?? "",
    clicks: Number(row.clicks ?? 0),
    impressions: Number(row.impressions ?? 0),
    ctr: Number(row.ctr ?? 0),
    position: Number(row.position ?? 0),
  }));
}

async function queryDimension(
  searchConsole,
  siteUrl,
  dateRange,
  dimension,
  limit,
) {
  return querySearchConsoleRows(
    searchConsole,
    siteUrl,
    {
      ...dateRange,
      dimensions: [dimension],
      dataState: "final",
      aggregationType: "auto",
    },
    { maxRows: limit },
  );
}

async function queryTotals(searchConsole, siteUrl, dateRange) {
  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      ...dateRange,
      dataState: "final",
      aggregationType: "auto",
      rowLimit: 1,
    },
  });
  return response.data.rows ?? [];
}

export async function createSearchPerformanceReport(
  argv = process.argv.slice(2),
) {
  const options = parseArguments(argv);
  const periods = getSearchConsolePeriods(options);
  const limit = getIntegerOption(options, "limit", 100, {
    minimum: 1,
    maximum: 25_000,
  });
  const config = await loadGoogleConfig();
  const searchConsole = createSearchConsoleClient();
  const [
    currentQueries,
    currentPages,
    previousQueries,
    currentTotalRows,
    previousTotalRows,
  ] = await Promise.all([
    queryDimension(
      searchConsole,
      config.siteUrl,
      periods.current,
      "query",
      limit,
    ),
    queryDimension(
      searchConsole,
      config.siteUrl,
      periods.current,
      "page",
      limit,
    ),
    queryDimension(
      searchConsole,
      config.siteUrl,
      periods.previous,
      "query",
      limit,
    ),
    queryTotals(searchConsole, config.siteUrl, periods.current),
    queryTotals(searchConsole, config.siteUrl, periods.previous),
  ]);
  const currentSummary = summarizeSearchConsoleTotalRows(currentTotalRows);
  const previousSummary = summarizeSearchConsoleTotalRows(previousTotalRows);
  const comparison = {
    clicksPercent: percentageChange(
      currentSummary.clicks,
      previousSummary.clicks,
    ),
    impressionsPercent: percentageChange(
      currentSummary.impressions,
      previousSummary.impressions,
    ),
    ctrPercentagePoints:
      (currentSummary.ctr - previousSummary.ctr) * 100,
    positionChange: currentSummary.position - previousSummary.position,
  };
  const queryRows = publicRows(currentQueries.rows, "query");
  const pageRows = publicRows(currentPages.rows, "page");
  const truncation = {
    currentQueries: currentQueries.truncated,
    currentPages: currentPages.truncated,
    previousQueries: previousQueries.truncated,
  };
  const payload = {
    periods,
    currentSummary,
    previousSummary,
    comparison,
    queries: queryRows,
    landingPages: pageRows,
    truncation,
    truncated: Object.values(truncation).some(Boolean),
  };
  const formatPercent = (value) =>
    value === null ? "new" : `${value.toFixed(1)}%`;

  writeOutput({
    json: options.json === true,
    payload,
    lines: [
      `Search performance: ${periods.current.startDate} through ${periods.current.endDate}`,
      `Previous period: ${periods.previous.startDate} through ${periods.previous.endDate}`,
      `Clicks: ${currentSummary.clicks} (${formatPercent(comparison.clicksPercent)})`,
      `Impressions: ${currentSummary.impressions} (${formatPercent(comparison.impressionsPercent)})`,
      `CTR: ${(currentSummary.ctr * 100).toFixed(2)}% (${comparison.ctrPercentagePoints.toFixed(2)} pp)`,
      `Average position: ${currentSummary.position.toFixed(2)} (${comparison.positionChange.toFixed(2)})`,
      "",
      "Queries",
      ...formatRows(queryRows, [
        { key: "query", label: "Query" },
        { key: "clicks", label: "Clicks" },
        { key: "impressions", label: "Impressions" },
        { key: "ctr", label: "CTR" },
        { key: "position", label: "Position" },
      ]),
      "",
      "Landing pages",
      ...formatRows(pageRows, [
        { key: "page", label: "Page" },
        { key: "clicks", label: "Clicks" },
        { key: "impressions", label: "Impressions" },
        { key: "ctr", label: "CTR" },
        { key: "position", label: "Position" },
      ]),
      payload.truncated ? `Output limited to ${limit} rows per section.` : "",
    ].filter((line, index, all) => line || all[index - 1] !== ""),
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => createSearchPerformanceReport());
}
