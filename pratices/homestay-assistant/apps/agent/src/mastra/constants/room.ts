/** Top-floor / luxury category → floor level in seed catalog. */
export const LUXURY_ROOM_LEVEL = 4;

export const ROOM_LEVEL_CATEGORY_WORD =
  /\b(?:luxury|premium|top[-\s]?floor|penthouse)\b/i;

export const ROOM_LEVEL_CATEGORY_WORD_GLOBAL =
  /\b(?:luxury|premium|top[-\s]?floor|penthouse)\b/gi;

/** Filler words the model may paste into `name` from the guest message. */
export const ROOM_NAME_FILLER =
  /\b(?:show|find|search|look|for|your|the|me|a|an|our|available|matching|rooms?|suites?)\b/gi;
