export function isoDate(daysAgo = 0, referenceDate = new Date()) {
  const date = new Date(referenceDate);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export const productionHostname = "thesweetfork.com";

export function productionHostFilter(eventFilter) {
  const hostnameFilter = {
    filter: {
      fieldName: "hostName",
      stringFilter: {
        matchType: "EXACT",
        value: productionHostname,
        caseSensitive: true,
      },
    },
  };

  return eventFilter
    ? { andGroup: { expressions: [hostnameFilter, eventFilter] } }
    : hostnameFilter;
}

function dateInTimeZone(referenceDate, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(referenceDate);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function getAnalyticsReportingPeriod(
  adminClient,
  propertyName,
  options,
  referenceDate = new Date(),
) {
  const [property] = await adminClient.getProperty({ name: propertyName });
  if (!property.timeZone) {
    throw new Error("The GA4 property reporting timezone is unavailable.");
  }

  return {
    timeZone: property.timeZone,
    dateRange: getDateRange(options, 30, {
      timeZone: property.timeZone,
      referenceDate,
    }),
  };
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

export function getDateRange(
  options,
  defaultDays = 30,
  // Matches the approved property configuration; live reports resolve it above.
  { timeZone = "America/Denver", referenceDate = new Date() } = {},
) {
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

  const rawDays = String(options.days ?? defaultDays);
  const days = Number(rawDays);
  if (!/^\d+$/.test(rawDays) || !Number.isInteger(days) || days < 1 || days > 730) {
    throw new Error("--days must be an integer from 1 to 730.");
  }

  // Shift calendar dates, not elapsed hours, so DST cannot change window length.
  const today = new Date(`${dateInTimeZone(referenceDate, timeZone)}T00:00:00.000Z`);
  return { startDate: isoDate(days, today), endDate: isoDate(1, today) };
}

export function getSearchConsolePeriods(
  options,
  defaultDays = 28,
  { referenceDate = new Date() } = {},
) {
  const current = getDateRange(
    options,
    defaultDays,
    { timeZone: "America/Los_Angeles", referenceDate },
  );
  // Search Console dates use Pacific time. Preserve the three-day final-data lag.
  if (!options.start && !options.end) {
    current.startDate = isoDate(2, new Date(`${current.startDate}T00:00:00.000Z`));
    current.endDate = isoDate(2, new Date(`${current.endDate}T00:00:00.000Z`));
  }

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
