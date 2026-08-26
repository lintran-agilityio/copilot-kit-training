/** Top-floor / luxury category → floor level in seed catalog. */
export const LUXURY_ROOM_LEVEL = 4;

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
