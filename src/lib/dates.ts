/**
 * Calendar-date helpers.
 *
 * Database dates are `@db.Date` values, which Prisma returns as a Date at
 * 00:00:00 UTC. All helpers therefore work on the YYYY-MM-DD string and use
 * UTC arithmetic, so a date never shifts because of the server's timezone.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

export function parseDateOnly(value: string): Date {
  if (!DATE_ONLY.test(value)) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return date;
}

export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's calendar date in the given IANA timezone, as YYYY-MM-DD. */
export function todayInTimeZone(
  timeZone: string = DEFAULT_TIMEZONE,
  now: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(dateString: string, days: number): string {
  const date = parseDateOnly(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

/** ISO weekday: Monday = 1 ... Sunday = 7. */
export function isoWeekday(dateString: string): number {
  const day = parseDateOnly(dateString).getUTCDay(); // 0 = Sunday
  return day === 0 ? 7 : day;
}

/** Monday of the week containing the given date. */
export function startOfWeek(dateString: string): string {
  return addDays(dateString, -(isoWeekday(dateString) - 1));
}

export function endOfWeek(dateString: string): string {
  return addDays(startOfWeek(dateString), 6);
}

export function weekRange(dateString: string): { start: string; end: string } {
  const start = startOfWeek(dateString);
  return { start, end: addDays(start, 6) };
}

export function isDateInWeek(dateString: string, weekStart: string): boolean {
  return isBetween(dateString, weekStart, addDays(weekStart, 6));
}

export function isBetween(
  dateString: string,
  start: string,
  end: string,
): boolean {
  return dateString >= start && dateString <= end;
}

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && formatDateOnly(date) === value;
}

export function formatShortDate(dateString: string): string {
  const date = parseDateOnly(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

/** Counts consecutive logged training days, starting today or yesterday. */
export function trainingStreak(today: string, sessionDates: string[]): number {
  const logged = new Set(sessionDates);
  let cursor = logged.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (logged.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
