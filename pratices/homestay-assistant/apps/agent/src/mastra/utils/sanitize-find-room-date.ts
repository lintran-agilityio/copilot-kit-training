import { getBusinessDates } from "@repo/utils/date";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolve relative date words the model often puts in `find_room.date`.
 * API requires absolute YYYY-MM-DD — `date=today` is a 400.
 */
export const sanitizeFindRoomDate = (
  date: string | undefined,
): string | undefined => {
  const trimmed = date?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (YMD.test(trimmed)) {
    return trimmed;
  }

  const { today, tomorrow, weekendCheckIn } = getBusinessDates();
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

  // Unrecognized non-YMD — drop so we do not 400 the rooms API.
  return undefined;
};
