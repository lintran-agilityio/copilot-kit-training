import {
  getWeekendRange,
  parseMonthName,
  resolveCalendarDate,
  resolveDayOfMonthDate,
  toYmd,
} from "./date.js";
import {
  LIST_MY_BOOKINGS_CORE,
  MONTH_DAY_CUE,
  MONTH_FIRST_DATE,
  DAY_FIRST_DATE,
  BARE_DAY_CUE,
  WEEKEND_CUE,
  NEXT_WEEKEND_CUE,
  LAST_WEEKEND_CUE,
} from "@repo/constants";

/** Deterministic routing intent for explicit show/list/view my bookings. */
export const LIST_MY_BOOKINGS_INTENT = "LIST_MY_BOOKINGS" as const;

export type ListMyBookingsDateRange = { from: string; to: string };

export type ListMyBookingsRouting = {
  intent: typeof LIST_MY_BOOKINGS_INTENT;
  /** YYYY-MM-DD when a single-date cue is present; otherwise null. */
  onDate: string | null;
  /** Saturday-to-Sunday span when a "weekend" cue is present; otherwise null. */
  dateRange: ListMyBookingsDateRange | null;
};

const parseMonthDayPhrase = (value: string, today: string): string | null => {
  const input = value.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);

  if (iso) {
    return toYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const monthFirst = MONTH_FIRST_DATE.exec(value);

  if (monthFirst) {
    const month = parseMonthName(monthFirst[1] ?? "");

    if (!month) return null;

    return resolveCalendarDate(
      today,
      month,
      Number(monthFirst[2]),
      monthFirst[3] ? Number(monthFirst[3]) : undefined,
    );
  }

  const dayFirst = DAY_FIRST_DATE.exec(value);

  if (dayFirst) {
    const month = parseMonthName(dayFirst[2] ?? "");

    if (!month) return null;

    return resolveCalendarDate(
      today,
      month,
      Number(dayFirst[1]),
      dayFirst[3] ? Number(dayFirst[3]) : undefined,
    );
  }

  return null;
};

/**
 * Parses an optional date cue from a "my bookings" request.
 *
 * Supported:
 * - "on August 15"
 * - "on 15 August"
 * - "on August 15, 2026"
 * - "on 15 August 2026"
 * - "on 2026-08-15"
 * - "on the 15th"
 * - "at 15"
 *
 * Bare day values use today's month.
 */
export const parseListMyBookingsOnDate = (
  message: string,
  today: string,
): string | null => {
  const text = message.trim();

  if (!text) return null;

  const monthDayMatch = MONTH_DAY_CUE.exec(text);

  if (monthDayMatch?.[1]) {
    const parsed = parseMonthDayPhrase(monthDayMatch[1], today);

    if (parsed) return parsed;
  }

  const bareDayMatch = BARE_DAY_CUE.exec(text);

  if (bareDayMatch?.[1]) {
    return resolveDayOfMonthDate(today, Number(bareDayMatch[1]));
  }

  return null;
};

/**
 * Parses an optional "weekend" cue from a "my bookings" request into the
 * Saturday-to-Sunday span, e.g. "show my bookings at weekend".
 *
 * "next weekend" / "last weekend" must be checked before the bare cue —
 * both also match WEEKEND_CUE, so checking it first would collapse them
 * all onto the current weekend.
 */
export const parseListMyBookingsDateRange = (
  message: string,
  today: string,
): ListMyBookingsDateRange | null => {
  const text = message.trim();

  if (!text) return null;

  if (NEXT_WEEKEND_CUE.test(text)) return getWeekendRange(today, 1);
  if (LAST_WEEKEND_CUE.test(text)) return getWeekendRange(today, -1);
  if (WEEKEND_CUE.test(text)) return getWeekendRange(today, 0);

  return null;
};

/**
 * Deterministic SHOW/LIST MY BOOKINGS override.
 *
 * Explicit list language wins over stale conversation context.
 * Cancel/modify requests without explicit show/list language do not match.
 *
 * CopilotKit title-generation prompts are excluded so they cannot trigger
 * get_bookings during hidden title-generation runs.
 */
export const detectListMyBookingsIntent = (
  message: string,
  today: string,
): ListMyBookingsRouting | null => {
  const text = message.trim();

  if (!text) return null;

  if (/^generate a short title for this conversation\b/i.test(text)) {
    return null;
  }

  if (!LIST_MY_BOOKINGS_CORE.test(text)) {
    return null;
  }

  return {
    intent: LIST_MY_BOOKINGS_INTENT,
    onDate: parseListMyBookingsOnDate(text, today),
    dateRange: parseListMyBookingsDateRange(text, today),
  };
};
