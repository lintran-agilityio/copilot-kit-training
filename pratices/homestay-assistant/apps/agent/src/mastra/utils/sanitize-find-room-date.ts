import {
  addDaysYmd,
  getBusinessDates,
  getWeekendStay,
  parseListMyBookingsOnDate,
} from "@repo/utils";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Guest phrasing the model often copies into `find_room.date`
 * ("from 15th", "on Aug 15"). Stripped only in FIND sanitize so
 * LIST_MY_BOOKINGS preposition rules stay unchanged.
 */
const LEADING_DATE_GLUE = /^(?:from|on|at|for)(?:\s+the)?\s+/i;

const businessDatesFor = (todayOverride?: string) => {
  if (!todayOverride) {
    return getBusinessDates();
  }

  const weekend = getWeekendStay(todayOverride);
  return {
    today: todayOverride,
    tomorrow: addDaysYmd(todayOverride, 1),
    weekendCheckIn: weekend.checkIn,
  };
};

/**
 * Resolve relative / guest date tokens the model often puts in `find_room.date`.
 * API requires absolute YYYY-MM-DD — `date=today` or `date=16th` is a 400 / empty search.
 *
 * Reuses shared guest-date parsing for ordinal / month-day tokens. FIND-only:
 * strip leading `from|on|at|for` before parsing so "from 15th" resolves without
 * widening LIST_MY_BOOKINGS preposition matching.
 *
 * @param date - Raw find_room.date from the model
 * @param todayOverride - Optional YYYY-MM-DD for deterministic tests
 */
export const sanitizeFindRoomDate = (
  date: string | undefined,
  todayOverride?: string,
): string | undefined => {
  const trimmed = date?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (YMD.test(trimmed)) {
    return trimmed;
  }

  const { today, tomorrow, weekendCheckIn } = businessDatesFor(todayOverride);
  const lower = trimmed.toLowerCase();

  if (lower === "today" || lower === "tonight") {
    return today;
  }

  if (lower === "tomorrow") {
    return tomorrow;
  }

  if (/\bweekend\b/.test(lower)) {
    return weekendCheckIn;
  }

  const withoutGlue = trimmed.replace(LEADING_DATE_GLUE, "").trim() || trimmed;
  const resolved = parseListMyBookingsOnDate(`on ${withoutGlue}`, today);
  if (resolved) {
    return resolved;
  }

  // Unrecognized non-YMD — drop so we do not 400 the rooms API.
  return undefined;
};
