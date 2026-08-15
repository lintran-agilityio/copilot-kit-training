import {
  BOOKING_CANCEL_PROMPT_PREFIX,
  CANCEL_WITHOUT_BOOKING_ID_CORE,
  TITLE_GENERATION_PROMPT_PATTERN,
} from "@repo/constants";

import {
  parseListMyBookingsDateRange,
  parseListMyBookingsOnDate,
  type ListMyBookingsDateRange,
} from "./list-my-bookings.js";

/** Deterministic routing intent for cancel when bookingId is unknown. */
export const CANCEL_WITHOUT_BOOKING_ID_INTENT =
  "CANCEL_WITHOUT_BOOKING_ID" as const;

export type CancelWithoutBookingIdRouting = {
  intent: typeof CANCEL_WITHOUT_BOOKING_ID_INTENT;
  /** YYYY-MM-DD when a date cue is present; otherwise null (all active). */
  onDate: string | null;
  /** Saturday-to-Sunday span when a "weekend" cue is present; otherwise null. */
  dateRange: ListMyBookingsDateRange | null;
};

const hasBookingIdMarker = (text: string): boolean =>
  /bookingId\s*:/i.test(text) ||
  text.includes(BOOKING_CANCEL_PROMPT_PREFIX);

/**
 * Deterministic CANCEL override when the guest asks to cancel but did not
 * supply `bookingId:` / `[booking-cancel]`.
 *
 * Date cues reuse LIST_MY_BOOKINGS parsers ("at 15th", "on August 15", …).
 * Explicit list/show language is handled by LIST_MY_BOOKINGS and must not
 * match here (no cancel verb). Title-generation prompts are excluded.
 */
export const detectCancelWithoutBookingIdIntent = (
  message: string,
  today: string,
): CancelWithoutBookingIdRouting | null => {
  const text = message.trim();

  if (!text) return null;

  if (TITLE_GENERATION_PROMPT_PATTERN.test(text)) {
    return null;
  }

  if (hasBookingIdMarker(text)) {
    return null;
  }

  if (!CANCEL_WITHOUT_BOOKING_ID_CORE.test(text)) {
    return null;
  }

  return {
    intent: CANCEL_WITHOUT_BOOKING_ID_INTENT,
    onDate: parseListMyBookingsOnDate(text, today),
    dateRange: parseListMyBookingsDateRange(text, today),
  };
};
