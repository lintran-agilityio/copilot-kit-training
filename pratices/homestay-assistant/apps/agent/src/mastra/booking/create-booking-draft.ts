import { addDaysYmd, resolveCalendarDate } from "@repo/utils/date";

/**
 * Provenance for a populated draft field.
 *
 * Priority (strongest → weakest):
 * user > ui > draft > structured-booking-context >
 * structured-search-context > default
 */
export type DraftFieldSource =
  | "user"
  | "ui"
  | "draft"
  | "structured-booking-context"
  | "structured-search-context"
  | "default";

export type ProvenancedValue<T> = {
  value: T;
  source: DraftFieldSource;
};

/** Flat booking draft values — no pricing. Unknown guests stay null. */
export type CreateBookingDraftValues = {
  roomId: string | null;
  roomName: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  guests: number | null;
};

export type ProvenancedCreateBookingDraft = {
  roomId: ProvenancedValue<string> | null;
  roomName: ProvenancedValue<string> | null;
  checkInDate: ProvenancedValue<string> | null;
  checkOutDate: ProvenancedValue<string> | null;
  guests: ProvenancedValue<number> | null;
};

export type CreateBookingDraftMissingField =
  | "roomId"
  | "checkIn"
  | "checkOut"
  | "guests";

export type CreateBookingDraftPartial = {
  roomId?: string | null;
  roomName?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  guests?: number | null;
};

/**
 * Structured Search Context — last find_room filters only.
 * Never inferred from free-form chat history.
 */
export type StructuredSearchContext = {
  /** Search stay date — becomes check-in only when check-in is still unknown. */
  date?: string | null;
  guests?: number | null;
};

export type MergeCreateBookingDraftInput = {
  /** Latest user message fields (strongest). */
  user?: CreateBookingDraftPartial;
  /** Selected UI entity — Book button, Room Card, Room Detail. */
  ui?: CreateBookingDraftPartial;
  /** Existing booking draft from prior turns. */
  draft?: CreateBookingDraftPartial;
  /** Structured Booking Context — prior structured stay/booking state. */
  structuredBookingContext?: CreateBookingDraftPartial;
  /** Structured Search Context — last find_room args only. */
  structuredSearchContext?: StructuredSearchContext;
  /**
   * Safe defaults only. Never invent guests (do not pass guests: 1 here).
   * Dates/room defaults are allowed when product policy defines them.
   */
  defaults?: CreateBookingDraftPartial;
};

export type MergeCreateBookingDraftResult = {
  draft: CreateBookingDraftValues;
  provenanced: ProvenancedCreateBookingDraft;
  missingFields: CreateBookingDraftMissingField[];
};

const SOURCE_PRIORITY: readonly DraftFieldSource[] = [
  "user",
  "ui",
  "draft",
  "structured-booking-context",
  "structured-search-context",
  "default",
] as const;

const EMPTY_DRAFT: CreateBookingDraftValues = {
  roomId: null,
  roomName: null,
  checkInDate: null,
  checkOutDate: null,
  guests: null,
};

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asPositiveInt = (value: unknown): number | null => {
  if (value == null) {
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

const pickProvenancedString = (
  candidates: ReadonlyArray<{
    source: DraftFieldSource;
    value: string | null | undefined;
  }>,
): ProvenancedValue<string> | null => {
  for (const source of SOURCE_PRIORITY) {
    const match = candidates.find((candidate) => candidate.source === source);
    const value = asNonEmptyString(match?.value);
    if (value) {
      return { value, source };
    }
  }
  return null;
};

const pickProvenancedGuests = (
  candidates: ReadonlyArray<{
    source: DraftFieldSource;
    value: number | null | undefined;
  }>,
): ProvenancedValue<number> | null => {
  for (const source of SOURCE_PRIORITY) {
    const match = candidates.find((candidate) => candidate.source === source);
    const value = asPositiveInt(match?.value);
    if (value != null) {
      return { value, source };
    }
  }
  return null;
};

/**
 * Deterministic missing-field list for HITL / step-machine routing.
 * Never invent values — absence means missing.
 */
export const getMissingBookingFields = (
  draft: Pick<
    CreateBookingDraftValues,
    "roomId" | "checkInDate" | "checkOutDate" | "guests"
  >,
): CreateBookingDraftMissingField[] => {
  const missingFields: CreateBookingDraftMissingField[] = [];

  if (!asNonEmptyString(draft.roomId)) {
    missingFields.push("roomId");
  }
  if (!asNonEmptyString(draft.checkInDate)) {
    missingFields.push("checkIn");
  }
  if (!asNonEmptyString(draft.checkOutDate)) {
    missingFields.push("checkOut");
  }
  if (asPositiveInt(draft.guests) == null) {
    missingFields.push("guests");
  }

  return missingFields;
};

/**
 * Merges create-booking draft fields by fixed priority.
 * Weaker sources never overwrite a value already set by a stronger source.
 * Guests stay null until an explicit positive integer appears — never invent 1.
 */
export const mergeCreateBookingDraft = (
  input: MergeCreateBookingDraftInput,
): MergeCreateBookingDraftResult => {
  const user = input.user ?? {};
  const ui = input.ui ?? {};
  const draft = input.draft ?? {};
  const structuredBookingContext = input.structuredBookingContext ?? {};
  const structuredSearchContext = input.structuredSearchContext ?? {};
  const defaults = input.defaults ?? {};

  const roomId = pickProvenancedString([
    { source: "user", value: user.roomId },
    { source: "ui", value: ui.roomId },
    { source: "draft", value: draft.roomId },
    {
      source: "structured-booking-context",
      value: structuredBookingContext.roomId,
    },
    { source: "default", value: defaults.roomId },
  ]);

  const roomName = pickProvenancedString([
    { source: "user", value: user.roomName },
    { source: "ui", value: ui.roomName },
    { source: "draft", value: draft.roomName },
    {
      source: "structured-booking-context",
      value: structuredBookingContext.roomName,
    },
    { source: "default", value: defaults.roomName },
  ]);

  const checkInDate = pickProvenancedString([
    { source: "user", value: user.checkInDate },
    { source: "ui", value: ui.checkInDate },
    { source: "draft", value: draft.checkInDate },
    {
      source: "structured-booking-context",
      value: structuredBookingContext.checkInDate,
    },
    // Search date is check-in only — never check-out, never overwrites stronger.
    {
      source: "structured-search-context",
      value: structuredSearchContext.date,
    },
    { source: "default", value: defaults.checkInDate },
  ]);

  const checkOutDate = pickProvenancedString([
    { source: "user", value: user.checkOutDate },
    { source: "ui", value: ui.checkOutDate },
    { source: "draft", value: draft.checkOutDate },
    {
      source: "structured-booking-context",
      value: structuredBookingContext.checkOutDate,
    },
    { source: "default", value: defaults.checkOutDate },
  ]);

  const guests = pickProvenancedGuests([
    { source: "user", value: user.guests },
    { source: "ui", value: ui.guests },
    { source: "draft", value: draft.guests },
    {
      source: "structured-booking-context",
      value: structuredBookingContext.guests,
    },
    {
      source: "structured-search-context",
      value: structuredSearchContext.guests,
    },
    // defaults.guests intentionally omitted from inventing guests=1 —
    // only apply when caller passes an explicit safe default policy.
    { source: "default", value: defaults.guests },
  ]);

  const provenanced: ProvenancedCreateBookingDraft = {
    roomId,
    roomName,
    checkInDate,
    checkOutDate,
    guests,
  };

  const merged: CreateBookingDraftValues = {
    roomId: roomId?.value ?? null,
    roomName: roomName?.value ?? null,
    checkInDate: checkInDate?.value ?? null,
    checkOutDate: checkOutDate?.value ?? null,
    guests: guests?.value ?? null,
  };

  return {
    draft: merged,
    provenanced,
    missingFields: getMissingBookingFields(merged),
  };
};

/* ------------------------------------------------------------------ */
/* Optional NL extraction for the current user message (source=user)   */
/* ------------------------------------------------------------------ */

const MONTH_TOKEN =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

const DATE_TOKEN = `(?:\\d{4}-\\d{2}-\\d{2}|(?:${MONTH_TOKEN})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTH_TOKEN})(?:,?\\s*\\d{4})?)`;

const WEEKDAY_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export type CreateBookingBusinessDates = {
  today: string;
  tomorrow: string;
  weekendCheckIn: string;
  weekendCheckOut: string;
};

export type ExtractCreateBookingUserFieldsResult = {
  fields: CreateBookingDraftPartial;
  /**
   * Wall-clock time from the message when present (e.g. "20:00", "8PM").
   * Conversational metadata only — availability and booking ignore this.
   */
  requestedTime: string | null;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const getYmdWeekday = (ymd: string): number => {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const day = Number(ymd.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

/**
 * Resolves an upcoming weekday. "next Friday" is strictly after today
 * when today is already that weekday (+7); otherwise the upcoming day.
 */
export const resolveWeekdayDate = (
  today: string,
  weekday: number,
  requireNext: boolean,
): string => {
  const current = getYmdWeekday(today);
  let delta = (weekday - current + 7) % 7;
  if (requireNext && delta === 0) {
    delta = 7;
  }
  return addDaysYmd(today, delta);
};

const parseMonthDayToken = (raw: string, today: string): string | null => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (iso) {
    return resolveCalendarDate(
      today,
      Number(iso[2]),
      Number(iso[3]),
      Number(iso[1]),
    );
  }

  const monthFirst = new RegExp(
    `^(${MONTH_TOKEN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?$`,
    "i",
  ).exec(raw.trim());

  if (monthFirst) {
    const month = MONTH_INDEX[monthFirst[1]!.toLowerCase()];
    const day = Number(monthFirst[2]);
    const year = monthFirst[3] ? Number(monthFirst[3]) : undefined;
    return month ? resolveCalendarDate(today, month, day, year) : null;
  }

  const dayFirst = new RegExp(
    `^(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_TOKEN})(?:,?\\s*(\\d{4}))?$`,
    "i",
  ).exec(raw.trim());

  if (dayFirst) {
    const day = Number(dayFirst[1]);
    const month = MONTH_INDEX[dayFirst[2]!.toLowerCase()];
    const year = dayFirst[3] ? Number(dayFirst[3]) : undefined;
    return month ? resolveCalendarDate(today, month, day, year) : null;
  }

  return null;
};

const extractDateAfterCue = (
  message: string,
  cue: RegExp,
  today: string,
): string | null => {
  const match = cue.exec(message);
  if (!match || match.index == null) {
    return null;
  }

  const rest = message.slice(match.index + match[0].length).trim();
  const token = new RegExp(`^(${DATE_TOKEN})`, "i").exec(rest);
  if (!token) {
    return null;
  }

  return parseMonthDayToken(token[0]!, today);
};

/**
 * Parses optional clock time; does not affect booking dates.
 * Accepts "8PM", "8:00 PM", "20:00", "20:00PM".
 */
export const extractRequestedTime = (message: string): string | null => {
  const withMinutes =
    /\b(?:at\s+)?(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?\b/i.exec(message);
  const hourOnly = withMinutes
    ? null
    : /\b(?:at\s+)?(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)\b/i.exec(message);

  const match = withMinutes ?? hourOnly;
  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = withMinutes ? Number(withMinutes[2]) : 0;
  const meridiemRaw = withMinutes ? withMinutes[3] : hourOnly?.[2];
  const meridiem = meridiemRaw?.replace(/\./g, "").toLowerCase();

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return null;
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return null;
  }

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  }
  if (meridiem === "am" && hour === 12) {
    hour = 0;
  }

  if (hour > 23) {
    return null;
  }

  return `${pad2(hour)}:${pad2(minute)}`;
};

const extractRelativeCheckIn = (
  message: string,
  dates: CreateBookingBusinessDates,
): string | null => {
  const lower = message.toLowerCase();

  if (/\b(today|tonight)\b/.test(lower)) {
    return dates.today;
  }
  if (/\btomorrow\b/.test(lower)) {
    return dates.tomorrow;
  }
  if (/\b(?:this\s+)?weekend\b/.test(lower)) {
    return dates.weekendCheckIn;
  }

  const nextWeekday =
    /\bnext\s+(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?)\b/i.exec(
      message,
    );
  if (nextWeekday) {
    const weekday = WEEKDAY_INDEX[nextWeekday[1]!.toLowerCase()];
    if (weekday != null) {
      return resolveWeekdayDate(dates.today, weekday, true);
    }
  }

  const bareWeekday =
    /\b(?:on\s+)?(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?)\b/i.exec(
      message,
    );
  if (bareWeekday) {
    const weekday = WEEKDAY_INDEX[bareWeekday[1]!.toLowerCase()];
    if (weekday != null) {
      return resolveWeekdayDate(dates.today, weekday, false);
    }
  }

  return null;
};

const extractGuestsFromMessage = (message: string): number | null => {
  const match =
    /\b(?:for\s+)?(\d+)\s+guests?\b/i.exec(message) ??
    /\bguests?\s*(?:to|=|:)?\s*(\d+)\b/i.exec(message) ??
    /\bparty\s+of\s+(\d+)\b/i.exec(message);

  if (!match) {
    return null;
  }

  return asPositiveInt(Number(match[1]));
};

/**
 * Extracts create-booking fields stated in the latest user message.
 * Room identity is left to the caller (book_resolve / UI selection).
 * Clock times are returned separately and must not drive availability.
 */
export const extractCreateBookingUserFields = (
  message: string,
  dates: CreateBookingBusinessDates,
): ExtractCreateBookingUserFieldsResult => {
  const text = message.trim();
  const fields: CreateBookingDraftPartial = {};

  if (!text) {
    return { fields, requestedTime: null };
  }

  const checkOut = extractDateAfterCue(
    text,
    /\b(?:check[\s-]?out|checkout)(?:\s+(?:date|day))?\s*(?:to|for|on|:)?\s+/i,
    dates.today,
  );
  if (checkOut) {
    fields.checkOutDate = checkOut;
  }

  const checkInCue = extractDateAfterCue(
    text,
    /\b(?:check[\s-]?in|checkin)(?:\s+(?:date|day))?\s*(?:to|for|on|:)?\s+/i,
    dates.today,
  );

  const fromTo = new RegExp(
    `\\bfrom\\s+(${DATE_TOKEN})\\s+to\\s+(${DATE_TOKEN})`,
    "i",
  ).exec(text);

  if (fromTo) {
    const from = parseMonthDayToken(fromTo[1]!, dates.today);
    const to = parseMonthDayToken(fromTo[2]!, dates.today);
    if (from) {
      fields.checkInDate = from;
    }
    if (to) {
      fields.checkOutDate = to;
    }
  }

  if (!fields.checkInDate && checkInCue) {
    fields.checkInDate = checkInCue;
  }

  if (!fields.checkInDate) {
    const atOnDate = new RegExp(
      `\\b(?:at|on)\\s+(${DATE_TOKEN})`,
      "i",
    ).exec(text);
    if (atOnDate) {
      const parsed = parseMonthDayToken(atOnDate[1]!, dates.today);
      if (parsed) {
        fields.checkInDate = parsed;
      }
    }
  }

  if (!fields.checkInDate) {
    const leadingDate = new RegExp(`\\b(${DATE_TOKEN})(?:\\s+at\\b)?`, "i").exec(
      text,
    );
    if (leadingDate) {
      const parsed = parseMonthDayToken(leadingDate[1]!, dates.today);
      if (parsed) {
        fields.checkInDate = parsed;
      }
    }
  }

  if (!fields.checkInDate) {
    const relative = extractRelativeCheckIn(text, dates);
    if (relative) {
      fields.checkInDate = relative;
    }
  }

  if (!fields.checkOutDate && /\b(?:this\s+)?weekend\b/i.test(text)) {
    fields.checkOutDate = dates.weekendCheckOut;
  }

  const guests = extractGuestsFromMessage(text);
  if (guests != null) {
    fields.guests = guests;
  }

  return {
    fields,
    requestedTime: extractRequestedTime(text),
  };
};

export const emptyCreateBookingDraft = (): CreateBookingDraftValues => ({
  ...EMPTY_DRAFT,
});

/** @deprecated Use StructuredSearchContext — same shape. */
export type PreviousSearchContext = StructuredSearchContext;
