export const MONTH_PATTERN =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

export const MONTH_DAY_CUE = new RegExp(
  `\\b(?:at|on|for)\\s+((?:${MONTH_PATTERN})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTH_PATTERN})(?:,?\\s*\\d{4})?|\\d{4}-\\d{2}-\\d{2})\\b`,
  "i",
);
export const MONTH_FIRST_DATE = /^(\S+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i;

export const DAY_FIRST_DATE =
  /^(\d{1,2})(?:st|nd|rd|th)?\s+(\S+)(?:,?\s*(\d{4}))?$/i;

export const BARE_DAY_CUE =
  /\b(?:at|on|for)(?:\s+the)?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;

/** "weekend" / "weekends" cue, e.g. "at weekend", "this weekend". */
export const WEEKEND_CUE = /\bweekends?\b/i;

/** "next weekend" cue — check before the bare WEEKEND_CUE, which also matches this text. */
export const NEXT_WEEKEND_CUE = /\bnext\s+weekends?\b/i;

/** "last/past/previous weekend" cue — check before the bare WEEKEND_CUE. */
export const LAST_WEEKEND_CUE = /\b(?:last|past|previous)\s+weekends?\b/i;