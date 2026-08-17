export const MONTH_PATTERN =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

export const LIST_MY_BOOKINGS_CORE =
  /(?:show|list|view|open)(?:\s+all)?\s+my\s+(?:bookings?|reservations?)|what\s+are\s+my\s+(?:bookings?|reservations?)/i;

/**
 * CopilotKit's hidden title-generation run embeds the guest line
 * ("…user: Show my bookings."). Deterministic booking intents must exclude
 * it so it cannot force get_bookings / cancel / modify tool calls during
 * that hidden run.
 */
export const TITLE_GENERATION_PROMPT_PATTERN =
  /^generate a short title for this conversation\b/i;

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

/**
 * Guest-count cue stated directly in a BOOK message, e.g. "2 guests",
 * "for 3 people", "4 pax", "2 adults". Matched and stripped before
 * {@link BARE_DAY_CUE} parsing so "for 2 guests" is never misread as
 * day-of-month 2.
 */
export const GUEST_COUNT_CUE = /\b(\d{1,2})\s*(?:guests?|people|persons?|pax|adults?)\b/i;

/** "weekend" / "weekends" cue, e.g. "at weekend", "this weekend". */
export const WEEKEND_CUE = /\bweekends?\b/i;

/** "next weekend" cue — check before the bare WEEKEND_CUE, which also matches this text. */
export const NEXT_WEEKEND_CUE = /\bnext\s+weekends?\b/i;

/** "last/past/previous weekend" cue — check before the bare WEEKEND_CUE. */
export const LAST_WEEKEND_CUE = /\b(?:last|past|previous)\s+weekends?\b/i;