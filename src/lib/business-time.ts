export const BUSINESS_TIME_ZONE = "America/Denver";

const dateKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const businessDatePartsFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
});
const businessDateTimePartsFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
});

function getBusinessDateParts(date: Date) {
  const parts = businessDatePartsFormatter.formatToParts(date);

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
  };
}

function parseDateKey(value: string) {
  const match = dateKeyPattern.exec(value);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
}

function dateKeyToUtcNoon(value: string) {
  const parsed = parseDateKey(value);

  if (!parsed) {
    return new Date(value);
  }

  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12));
}

function getUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = businessDateTimePartsFormatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const localizedAsUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
    getPart("second"),
  );

  return localizedAsUtc - date.getTime();
}

function businessWallTimeToUtc(
  dateKey: string,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
) {
  const parsed = parseDateKey(dateKey);

  if (!parsed) {
    throw new Error(`Invalid business date key: ${dateKey}`);
  }

  const wallTimeAsUtc = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    hours,
    minutes,
    seconds,
    milliseconds,
  );
  const firstPass = wallTimeAsUtc - getTimeZoneOffsetMs(new Date(wallTimeAsUtc));
  const secondPass = wallTimeAsUtc - getTimeZoneOffsetMs(new Date(firstPass));

  return new Date(secondPass);
}

export function getBusinessDateKey(date = new Date()) {
  const { day, month, year } = getBusinessDateParts(date);

  return `${year}-${month}-${day}`;
}

export function getBusinessMonthKey(date = new Date()) {
  return getBusinessDateKey(date).slice(0, 7);
}

export function addBusinessDateDays(dateKey: string, days: number) {
  const parsed = parseDateKey(dateKey);

  if (!parsed) {
    throw new Error(`Invalid business date key: ${dateKey}`);
  }

  return getUtcDateKey(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days, 12)));
}

export function getBusinessDayUtcRange(dateKey: string) {
  const start = businessWallTimeToUtc(dateKey, 0, 0, 0, 0);
  const nextDayStart = businessWallTimeToUtc(addBusinessDateDays(dateKey, 1), 0, 0, 0, 0);

  return {
    endIso: new Date(nextDayStart.getTime() - 1).toISOString(),
    startIso: start.toISOString(),
  };
}

export function formatBusinessDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  const date = typeof value === "string" ? dateKeyToUtcNoon(value) : value;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    ...options,
  }).format(date);
}
