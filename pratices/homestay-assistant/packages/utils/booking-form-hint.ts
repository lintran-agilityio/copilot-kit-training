import { GUEST_COUNT_CUE } from "@repo/constants";
import { parseListMyBookingsOnDate } from "./list-my-bookings.js";

export type BookingFormMessageHint = {
  checkInDate: string | null;
  guests: number | null;
};

const MAX_GUEST_CUE_VALUE = 20;

/** Guest count stated directly in a BOOK message, e.g. "for 2 guests". */
export const parseBookingFormGuestCount = (message: string): number | null => {
  const match = GUEST_COUNT_CUE.exec(message);

  if (!match?.[1]) return null;

  const guests = Number(match[1]);

  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUEST_CUE_VALUE) {
    return null;
  }

  return guests;
};

/**
 * Parses a check-in date and/or guest count stated directly in a BOOK
 * message (e.g. "Book Heritage Master Suite room at 18th for 2 guests"),
 * so the Booking Form can prefill/focus those values instead of losing
 * them — find_room's book_resolve lookup intentionally omits date/guests
 * from its own args (see WORKFLOW — BOOK).
 *
 * The guest-count phrase is stripped before date parsing so "for 2 guests"
 * is never misread by the shared `at|on|for N` day cue as day-of-month 2.
 */
export const parseBookingFormMessageHint = (
  message: string,
  today: string,
): BookingFormMessageHint => {
  const guests = parseBookingFormGuestCount(message);
  const withoutGuestPhrase = message.replace(GUEST_COUNT_CUE, " ");
  const checkInDate = parseListMyBookingsOnDate(withoutGuestPhrase, today);

  return { checkInDate, guests };
};
