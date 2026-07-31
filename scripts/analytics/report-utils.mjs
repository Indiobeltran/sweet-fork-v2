export function isoDate(daysAgo = 0, referenceDate = new Date()) {
  const date = new Date(referenceDate);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${label} is not a valid calendar date.`);
  }

  return value;
}

export function getDateRange(options, defaultDays = 30) {
  if (options.start || options.end) {
    if (!options.start || !options.end) {
      throw new Error("--start and --end must be provided together.");
    }

    const startDate = parseIsoDate(String(options.start), "--start");
    const endDate = parseIsoDate(String(options.end), "--end");
    if (startDate > endDate) {
      throw new Error("--start must be on or before --end.");
    }

    return { startDate, endDate };
  }

  const days = Number.parseInt(String(options.days ?? defaultDays), 10);
  if (!Number.isInteger(days) || days < 1 || days > 730) {
    throw new Error("--days must be an integer from 1 to 730.");
  }

  return {
    startDate: isoDate(days - 1),
    endDate: isoDate(0),
  };
}

export function getSearchConsolePeriods(options, defaultDays = 28) {
  const current = getDateRange(
    options.start || options.end
      ? options
      : {
          days: options.days ?? defaultDays,
          start: isoDate(
            Number.parseInt(String(options.days ?? defaultDays), 10) + 2,
          ),
          end: isoDate(3),
        },
    defaultDays,
  );

  const currentStart = new Date(`${current.startDate}T00:00:00.000Z`);
  const currentEnd = new Date(`${current.endDate}T00:00:00.000Z`);
  const lengthDays =
    Math.round((currentEnd.valueOf() - currentStart.valueOf()) / 86_400_000) +
    1;
  const previousEnd = new Date(currentStart);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - lengthDays + 1);

  return {
    current,
    previous: {
      startDate: previousStart.toISOString().slice(0, 10),
      endDate: previousEnd.toISOString().slice(0, 10),
    },
  };
}

export function analyticsRowsToObjects(response) {
  const dimensionNames = (response.dimensionHeaders ?? []).map(
    (header) => header.name,
  );
  const metricNames = (response.metricHeaders ?? []).map(
    (header) => header.name,
  );

  return (response.rows ?? []).map((row) => {
    const result = {};

    dimensionNames.forEach((name, index) => {
      result[name] = row.dimensionValues?.[index]?.value ?? "";
    });
    metricNames.forEach((name, index) => {
      result[name] = row.metricValues?.[index]?.value ?? "0";
    });

    return result;
  });
}

export async function runPaginatedAnalyticsReport(
  dataClient,
  request,
  { maxRows = 1_000, pageSize = 250 } = {},
) {
  const rows = [];
  let offset = 0;
  let rowCount = 0;

  do {
    const [response] = await dataClient.runReport({
      ...request,
      limit: Math.min(pageSize, maxRows - rows.length),
      offset,
      returnPropertyQuota: true,
    });
    const pageRows = analyticsRowsToObjects(response);
    rows.push(...pageRows);
    rowCount = Number(response.rowCount ?? pageRows.length);
    offset += pageRows.length;

    if (pageRows.length === 0) break;
  } while (offset < rowCount && rows.length < maxRows);

  return { rows, rowCount, truncated: rows.length < rowCount };
}

export function sumMetric(rows, metric) {
  return rows.reduce(
    (total, row) => total + Number.parseFloat(row[metric] ?? "0"),
    0,
  );
}

export function percentageChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export async function querySearchConsoleRows(
  searchConsole,
  siteUrl,
  request,
  { maxRows = 1_000, pageSize = 25_000 } = {},
) {
  const rows = [];
  let startRow = 0;

  while (rows.length < maxRows) {
    const rowLimit = Math.min(pageSize, maxRows - rows.length);
    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        ...request,
        rowLimit,
        startRow,
      },
    });
    const pageRows = response.data.rows ?? [];
    rows.push(...pageRows);

    if (pageRows.length < rowLimit) break;
    startRow += pageRows.length;
  }

  return { rows, truncated: rows.length >= maxRows };
}
