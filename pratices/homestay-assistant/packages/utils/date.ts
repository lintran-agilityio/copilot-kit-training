/** Homestay business calendar — keep "today"/"tomorrow" aligned with guest TZ. */
export const BUSINESS_TIME_ZONE = "Asia/Ho_Chi_Minh";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
});

const SATURDAY = 6;
const SUNDAY = 0;

export const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (value: string) =>
  startOfDay(new Date(`${value}T00:00:00`));

export const isCheckOutAfterCheckIn = (checkIn: string, checkOut: string) =>
  parseDateKey(checkOut).getTime() > parseDateKey(checkIn).getTime();

export const formatShortDateForDisplay = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });


/** Format a Date as YYYY-MM-DD in the business timezone. */
export const formatYmd = (date: Date): string => {
  const parts = ymdFormatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format date as YYYY-MM-DD");
  }

  return `${year}-${month}-${day}`;
};

/** Split YYYY-MM-DD into numeric parts, rejecting anything malformed. */
const splitYmd = (ymd: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    throw new Error(`Invalid YYYY-MM-DD date: ${ymd}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

/** Add calendar days in the business timezone, return YYYY-MM-DD. */
export const addDaysYmd = (ymd: string, days: number): string => {
  const { year, month, day } = splitYmd(ymd);
  // Noon UTC avoids DST edge cases when shifting calendar days.
  const utc = Date.UTC(year, month - 1, day + days, 12, 0, 0);
  return formatYmd(new Date(utc));
};

/**
 * Weekday of a business calendar date, 0 = Sunday. The date is already in
 * business time, so it is read back as UTC to avoid a second timezone shift.
 */
const getYmdWeekday = (ymd: string): number => {
  const { year, month, day } = splitYmd(ymd);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

export const formatYmdWeekday = (ymd: string): string => {
  const { year, month, day } = splitYmd(ymd);
  return weekdayFormatter.format(new Date(Date.UTC(year, month - 1, day)));
};

/**
 * Resolves "this weekend" to a concrete Saturday-night stay. Models cannot
 * derive a weekday from a date reliably, so this must be computed here.
 *
 * A guest already inside the weekend means the one in progress, so check-in
 * stays on Sunday rather than jumping six days ahead.
 */
export const getWeekendStay = (today: string) => {
  const weekday = getYmdWeekday(today);
  const checkIn =
    weekday === SUNDAY ? today : addDaysYmd(today, (SATURDAY - weekday) % 7);

  return { checkIn, checkOut: addDaysYmd(checkIn, 1) };
};

export const getBusinessDates = (now = new Date()) => {
  const today = formatYmd(now);
  const weekend = getWeekendStay(today);

  return {
    today,
    todayWeekday: formatYmdWeekday(today),
    tomorrow: addDaysYmd(today, 1),
    weekendCheckIn: weekend.checkIn,
    weekendCheckOut: weekend.checkOut,
    timezone: BUSINESS_TIME_ZONE,
  };
};
