import {
  BOOKING_MODIFY_PROMPT_PREFIX,
  MODIFY_WITHOUT_BOOKING_ID_CORE,
} from "@repo/constants";

import { parseListMyBookingsOnDate } from "./list-my-bookings.js";

/** Deterministic routing intent for modify when bookingId is unknown. */
export const MODIFY_WITHOUT_BOOKING_ID_INTENT =
  "MODIFY_WITHOUT_BOOKING_ID" as const;

export type ModifyWithoutBookingIdRouting = {
  intent: typeof MODIFY_WITHOUT_BOOKING_ID_INTENT;
  /** YYYY-MM-DD when a date cue is present; otherwise null (all active). */
  onDate: string | null;
};

const hasBookingIdMarker = (text: string): boolean =>
  /bookingId\s*:/i.test(text) ||
  text.includes(BOOKING_MODIFY_PROMPT_PREFIX);

/**
 * Deterministic MODIFY override when the guest asks to modify but did not
 * supply `bookingId:` / `[booking-modify]`.
 *
 * Date cues reuse LIST_MY_BOOKINGS parsers ("at 15th", "on August 15", …).
 * Explicit list/show language is handled by LIST_MY_BOOKINGS and must not
 * match here (no modify verb alone). Title-generation prompts are excluded.
 * Cancel verbs are excluded so cancel-without-id owns those turns.
 */
export const detectModifyWithoutBookingIdIntent = (
  message: string,
  today: string,
): ModifyWithoutBookingIdRouting | null => {
  const text = message.trim();

  if (!text) return null;

  if (/^generate a short title for this conversation\b/i.test(text)) {
    return null;
  }

  if (hasBookingIdMarker(text)) {
    return null;
  }

  // Cancel owns cancel language even if "change" appears elsewhere.
  if (/\bcancel(?:l(?:ed|ing|ation))?s?\b/i.test(text)) {
    return null;
  }

  if (!MODIFY_WITHOUT_BOOKING_ID_CORE.test(text)) {
    return null;
  }

  return {
    intent: MODIFY_WITHOUT_BOOKING_ID_INTENT,
    onDate: parseListMyBookingsOnDate(text, today),
  };
};
