// -----------------------------------------------------------------------------
// Month patterns
// -----------------------------------------------------------------------------

/** Month names, full or abbreviated. */
export const MONTH_PATTERN =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

/** ISO date format: YYYY-MM-DD. */
export const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// -----------------------------------------------------------------------------
// Date patterns
// -----------------------------------------------------------------------------

/**
 * Matches an ISO date appearing anywhere in text.
 *
 * Example:
 * - "check in 2026-08-15"
 */
export const YMD_DATE_CUE = /\d{4}-\d{2}-\d{2}/;
/**
 * Matches date expressions introduced by "at", "on", or "for".
 *
 * Examples:
 * - on August 15
 * - for August 15, 2026
 * - on 15 August
 * - at 15th August 2026
 * - on 2026-08-15
 */
export const DATE_CUE = new RegExp(
  `\\b(?:at|on|for)\\s+((?:${MONTH_PATTERN})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTH_PATTERN})(?:,?\\s*\\d{4})?|\\d{4}-\\d{2}-\\d{2})\\b`,
  "i",
);

/** Month-first date, e.g. "August 15" or "August 15, 2026". */
export const MONTH_FIRST_DATE =
  /^(\S+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i;

/** Day-first date, e.g. "15 August" or "15th August 2026". */
export const DAY_FIRST_DATE =
  /^(\d{1,2})(?:st|nd|rd|th)?\s+(\S+)(?:,?\s*(\d{4}))?$/i;

/** Bare day cue, e.g. "at 15" or "on the 15th". */
export const BARE_DAY_CUE =
  /\b(?:at|on|for)(?:\s+the)?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;

// -----------------------------------------------------------------------------
// Relative date patterns
// -----------------------------------------------------------------------------

/** English relative dates: today, tonight, tomorrow. */
export const TODAY_TONIGHT_TOMORROW_CUE =
  /\b(today|tonight|tomorrow)\b/i;

/** English weekday names. */
export const WEEKDAY_CUE =
  /\b(mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)(day)?\b/i;

/**
 * Vietnamese date expressions.
 *
 * Examples:
 * - hôm nay
 * - tối nay
 * - ngày mai
 * - cuối tuần
 * - thứ 2 ... thứ 7
 * - chủ nhật
 * - ngày 15
 */
export const VI_DATE_CUE =
  /\b(hôm\s*nay|tối\s*nay|ngày\s*mai|cuối\s*tuần|th(ứ|u)\s*[2-7]|chủ\s*nhật|ngày\s*\d{1,2})\b/i;


// -----------------------------------------------------------------------------
// Weekend patterns
// -----------------------------------------------------------------------------

/** "weekend" / "weekends", e.g. "at weekend", "this weekend". */
export const WEEKEND_CUE = /\bweekends?\b/i;

/** "next weekend" — check before WEEKEND_CUE. */
export const NEXT_WEEKEND_CUE = /\bnext\s+weekends?\b/i;

/** "last/past/previous weekend" — check before WEEKEND_CUE. */
export const LAST_WEEKEND_CUE =
  /\b(?:last|past|previous)\s+weekends?\b/i;

// -----------------------------------------------------------------------------
// Booking constraint patterns
// -----------------------------------------------------------------------------

/** Guest count expressions, e.g. "2 guests", "3 people", "4 khách". */
export const GUEST_COUNT_CUE =
  /\d+\s*(?:guests?|people|persons?|pax|adults?|khách|người)\b/i;

/**
 * Guest phrasing the model often copies into `find_room.date`
 * ("from 15th", "on Aug 15"). Stripped only in FIND sanitize so
 * LIST_MY_BOOKINGS preposition rules stay unchanged.
 */
export const LEADING_DATE_GLUE = /^(?:from|on|at|for)(?:\s+the)?\s+/i;

export const ROOM_LEVEL_CATEGORY_WORD =
  /\b(?:luxury|premium|top[-\s]?floor|penthouse)\b/i;

export const ROOM_LEVEL_CATEGORY_WORD_GLOBAL = new RegExp(
  ROOM_LEVEL_CATEGORY_WORD.source,
  "gi",
);

/**
 * Filler words the model may paste into `name` from the guest message.
 * Include date-phrase glue ("at weekend", "on Monday", "from today") so
 * residual crumbs like "at" do not become a literal room-name LIKE filter
 * (API returns [] for `name=at`).
 */
export const ROOM_NAME_FILLER =
  /\b(?:show|find|search|look|for|your|the|me|a|an|our|available|matching|rooms?|suites?|guests?|at|on|in|from|this|next|by|with|to|st|nd|rd|th)\b/gi;

/**
 * Weekdays, months, and relative date words — date expression parts, never room titles.
 * Keep in sync with soft-book / find_room prompt rules.
 */
export const ROOM_CALENDAR_WORD =
  /\b(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|today|tonight|tomorrow|weekend)\b/i;

export const ROOM_CALENDAR_WORD_GLOBAL = new RegExp(
  ROOM_CALENDAR_WORD.source,
  "gi",
);