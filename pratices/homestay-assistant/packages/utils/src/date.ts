/** Homestay business calendar — keep "today"/"tomorrow" aligned with guest TZ. */
export const BUSINESS_TIME_ZONE = "Asia/Ho_Chi_Minh";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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

/** Add calendar days in the business timezone, return YYYY-MM-DD. */
export const addDaysYmd = (ymd: string, days: number): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    throw new Error(`Invalid YYYY-MM-DD date: ${ymd}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Noon UTC avoids DST edge cases when shifting calendar days.
  const utc = Date.UTC(year, month - 1, day + days, 12, 0, 0);
  return formatYmd(new Date(utc));
};

export const getBusinessDates = (now = new Date()) => {
  const today = formatYmd(now);

  return {
    today,
    tomorrow: addDaysYmd(today, 1),
    timezone: BUSINESS_TIME_ZONE,
  };
};
