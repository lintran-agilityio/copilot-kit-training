import {
  BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX,
  BOOKING_CANCEL_PROMPT_PREFIX,
  BOOKING_FORM_PROMPT_PREFIX,
  BOOKING_MODIFY_PROMPT_PREFIX,
  BOOKING_STAY_PROMPT_PREFIX,
  PAGE_ROOMS_PROMPT_PREFIX,
  TOOL_KEYS,
} from "@repo/constants";
import { addDaysYmd, resolveCalendarDate } from "@repo/utils/date";

export { resolveCalendarDate } from "@repo/utils/date";

/** Absolute stay fields the guest already stated in natural language. */
export type StatedModifyChanges = {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  /** Relative checkout shift, applied against the current booking checkout. */
  extendCheckoutByNights?: number;
};

export type ModifyStayFields = {
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

const UI_PROMPT_PREFIXES = [
  BOOKING_MODIFY_PROMPT_PREFIX,
  BOOKING_CANCEL_PROMPT_PREFIX,
  BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX,
  BOOKING_FORM_PROMPT_PREFIX,
  BOOKING_STAY_PROMPT_PREFIX,
  PAGE_ROOMS_PROMPT_PREFIX,
] as const;

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

const WORD_NIGHTS: Record<string, number> = {
  a: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
};

/**
 * True when the latest user message is a structured UI action tag, not free-form NL.
 */
export const isStructuredBookingUiPrompt = (message: string): boolean => {
  const trimmed = message.trim();
  return UI_PROMPT_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
};

const parseMonthDayToken = (
  raw: string,
  today: string,
): string | null => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (iso) {
    return toYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const monthFirst =
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i.exec(
      raw.trim(),
    );

  if (monthFirst) {
    const month = MONTH_INDEX[monthFirst[1]!.toLowerCase()];
    const day = Number(monthFirst[2]);
    const year = monthFirst[3] ? Number(monthFirst[3]) : undefined;
    return month ? resolveCalendarDate(today, month, day, year) : null;
  }

  const dayFirst =
    /^(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*(\d{4}))?$/i.exec(
      raw.trim(),
    );

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
  const token =
    /^(\d{4}-\d{2}-\d{2}|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*\d{4})?)/i.exec(
      rest,
    );

  if (!token) {
    return null;
  }

  return parseMonthDayToken(token[0]!, today);
};

const parseNightCount = (raw: string): number | null => {
  const lower = raw.toLowerCase();
  if (WORD_NIGHTS[lower] != null) {
    return WORD_NIGHTS[lower]!;
  }

  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * Extracts clearly stated check-in / check-out / guest changes from free-form text.
 * Returns null when nothing actionable was stated (vague modify → edit form).
 */
export const extractStatedModifyChanges = (
  message: string,
  today: string,
): StatedModifyChanges | null => {
  const text = message.trim();

  if (!text || isStructuredBookingUiPrompt(text)) {
    return null;
  }

  const changes: StatedModifyChanges = {};

  const checkOut = extractDateAfterCue(
    text,
    /\b(?:check[\s-]?out|checkout)(?:\s+(?:date|day))?\s*(?:to|for|on|:)?\s+/i,
    today,
  );
  if (checkOut) {
    changes.checkOutDate = checkOut;
  }

  const checkIn = extractDateAfterCue(
    text,
    /\b(?:check[\s-]?in|checkin)(?:\s+(?:date|day))?\s*(?:to|for|on|:)?\s+/i,
    today,
  );
  if (checkIn) {
    changes.checkInDate = checkIn;
  }

  // "extend to Aug 22" without saying checkout — treat as new checkout.
  if (!changes.checkOutDate) {
    const extendTo = extractDateAfterCue(
      text,
      /\bextend(?:\s+(?:my\s+)?stay)?\s+to\s+/i,
      today,
    );
    if (extendTo) {
      changes.checkOutDate = extendTo;
    }
  }

  const extendBy =
    /\bextend(?:\s+(?:my\s+)?stay)?\s+by\s+(\d+|a|one|two|three|four|five|six|seven)\s+nights?\b/i.exec(
      text,
    ) ??
    /\b(?:add|for)\s+(\d+|a|one|two|three|four|five|six|seven)\s+more\s+nights?\b/i.exec(
      text,
    ) ??
    /\b(\d+|one|a)\s+more\s+nights?\b/i.exec(text);

  if (extendBy) {
    const nights = parseNightCount(extendBy[1]!);
    if (nights != null) {
      changes.extendCheckoutByNights = nights;
    }
  }

  const guestsMatch =
    /\b(?:change\s+)?(?:the\s+)?(?:number\s+of\s+)?guests?\s*(?:to|=|:)\s*(\d+)\b/i.exec(
      text,
    ) ?? /\bmake\s+(?:it\s+)?(\d+)\s+guests?\b/i.exec(text);

  if (guestsMatch) {
    const guests = Number(guestsMatch[1]);
    if (Number.isInteger(guests) && guests > 0) {
      changes.guests = guests;
    }
  }

  if (
    changes.checkInDate == null &&
    changes.checkOutDate == null &&
    changes.guests == null &&
    changes.extendCheckoutByNights == null
  ) {
    return null;
  }

  return changes;
};

/**
 * Merges stated fields over the current booking stay.
 * Relative extend applies to the current checkout when no absolute checkout was stated.
 */
export const mergeStatedModifyStay = (
  current: ModifyStayFields,
  stated: StatedModifyChanges,
): ModifyStayFields | null => {
  let checkOutDate = stated.checkOutDate ?? current.checkOutDate;

  if (stated.extendCheckoutByNights != null && stated.checkOutDate == null) {
    checkOutDate = addDaysYmd(
      current.checkOutDate,
      stated.extendCheckoutByNights,
    );
  }

  const next: ModifyStayFields = {
    checkInDate: stated.checkInDate ?? current.checkInDate,
    checkOutDate,
    guests: stated.guests ?? current.guests,
  };

  if (next.checkOutDate <= next.checkInDate) {
    return null;
  }

  if (
    next.checkInDate === current.checkInDate &&
    next.checkOutDate === current.checkOutDate &&
    next.guests === current.guests
  ) {
    return null;
  }

  return next;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asPositiveInt = (value: unknown): number | undefined => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return undefined;
  }
  return n;
};

export type ResolvedBookingForStatedModify = {
  bookingId: string;
  roomId: string;
  capacity?: number;
  current: ModifyStayFields;
};

const parseStayFromBookingRecord = (
  booking: Record<string, unknown>,
): ModifyStayFields | null => {
  const checkInDate = asNonEmptyString(booking.checkInDate);
  const checkOutDate = asNonEmptyString(booking.checkOutDate);
  const guests = asPositiveInt(booking.guests);

  if (!checkInDate || !checkOutDate || guests == null) {
    return null;
  }

  return { checkInDate, checkOutDate, guests };
};

/**
 * Resolves a single active booking from find_booking_by_id or get_bookings output.
 */
export const resolveBookingFromLookupResult = (
  toolName: string | undefined,
  output: unknown,
): ResolvedBookingForStatedModify | null => {
  const result = asRecord(output);
  if (!result || !Array.isArray(result.bookings)) {
    return null;
  }

  if (toolName === TOOL_KEYS.BOOKING.FIND_BY_ID) {
    if (result.bookings.length === 0) {
      return null;
    }

    const booking = asRecord(result.bookings[0]);
    const room = asRecord(result.room);
    if (!booking) {
      return null;
    }

    const current = parseStayFromBookingRecord(booking);
    const bookingId =
      asNonEmptyString(booking.bookingId) ?? asNonEmptyString(result.bookingId);
    const roomId =
      asNonEmptyString(room?.id) ?? asNonEmptyString(booking.roomId);

    if (!current || !bookingId || !roomId) {
      return null;
    }

    return {
      bookingId,
      roomId,
      capacity: asPositiveInt(room?.capacity),
      current,
    };
  }

  if (toolName === TOOL_KEYS.BOOKING.GET) {
    if (result.bookings.length !== 1) {
      return null;
    }

    const booking = asRecord(result.bookings[0]);
    if (!booking) {
      return null;
    }

    const current = parseStayFromBookingRecord(booking);
    const bookingId =
      asNonEmptyString(booking.id) ?? asNonEmptyString(booking.bookingId);
    const room = asRecord(booking.room);
    const roomId = asNonEmptyString(booking.roomId);

    if (!current || !bookingId || !roomId) {
      return null;
    }

    return {
      bookingId,
      roomId,
      capacity: asPositiveInt(room?.capacity),
      current,
    };
  }

  return null;
};
