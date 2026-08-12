export const MONTH_PATTERN =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

export const LIST_MY_BOOKINGS_CORE =
  /(?:show|list|view|open)(?:\s+all)?\s+my\s+(?:bookings?|reservations?)|what\s+are\s+my\s+(?:bookings?|reservations?)/i;

/** Cancel language without a known bookingId (chat NL cancel / cancel room). */
export const CANCEL_WITHOUT_BOOKING_ID_CORE =
  /\bcancel(?:l(?:ed|ing|ation))?s?\b/i;

/**
 * Modify language without a known bookingId (chat NL modify / change dates or guests).
 * Excludes pure cancel verbs; list/show is handled separately.
 */
export const MODIFY_WITHOUT_BOOKING_ID_CORE =
  /\b(?:modify|update)\b|\bchange\s+(?:(?:my|the|this)\s+)?(?:booking|reservation|stay|guests?|check[- ]?in|check[- ]?out|dates?)|\bextend(?:\s+(?:my|the|this))?\s+stay\b|\bshorten(?:\s+(?:my|the|this))?\s+stay\b|\b(?:change|update)\s+guests?\b|\b(?:change|update|extend|move)\s+(?:check[- ]?in|check[- ]?out|checkout)\b/i;

export const MONTH_DAY_CUE = new RegExp(
  `\\b(?:at|on|for)\\s+((?:${MONTH_PATTERN})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTH_PATTERN})(?:,?\\s*\\d{4})?|\\d{4}-\\d{2}-\\d{2})\\b`,
  "i",
);
export const MONTH_FIRST_DATE = /^(\S+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i;

export const DAY_FIRST_DATE =
  /^(\d{1,2})(?:st|nd|rd|th)?\s+(\S+)(?:,?\s*(\d{4}))?$/i;

export const BARE_DAY_CUE =
  /\b(?:at|on|for)(?:\s+the)?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;