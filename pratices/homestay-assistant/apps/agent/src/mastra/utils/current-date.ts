import { getBusinessDates } from "@repo/utils/date";

/** Prompt block with today + tomorrow so relative dates resolve correctly. */
export const buildCurrentDateInstructions = (now = new Date()): string => {
  const {
    today,
    todayWeekday,
    tomorrow,
    weekendCheckIn,
    weekendCheckOut,
    nextWeekendCheckIn,
    nextWeekendCheckOut,
    timezone,
  } = getBusinessDates(now);

  return `## CURRENT DATE (authoritative — read first)
    Today is ${todayWeekday}, ${today} (YYYY-MM-DD, timezone ${timezone}).
    Tomorrow is ${tomorrow}.
    "This weekend" / "the weekend" / "cuối tuần" (no "next"/"tới"/"sau" qualifier) is ALWAYS check-in ${weekendCheckIn}, check-out ${weekendCheckOut}.
    "Next weekend" / "cuối tuần tới" / "cuối tuần sau" is ALWAYS check-in ${nextWeekendCheckIn}, check-out ${nextWeekendCheckOut} — a different, later date than "this weekend". Never conflate the two.
    Copy the matching pair verbatim — never compute a weekend yourself, never use ${tomorrow} for a weekend request, and never substitute the "this weekend" dates when the guest said "next weekend" (or vice versa).
    When the guest says relative dates (today, tomorrow, next Friday, in 3 days), convert them using these values.
    Examples: "tomorrow" → ${tomorrow}; "today" → ${today}; "this weekend" → ${weekendCheckIn} to ${weekendCheckOut}; "next weekend" → ${nextWeekendCheckIn} to ${nextWeekendCheckOut}.
    Weekday words in the guest message (Mon, Monday, Tue, Friday, Sat, …) are part of a date expression — resolve to YYYY-MM-DD for date fields; never pass them as find_room.name.
    Do not invent which weekday a YYYY-MM-DD falls on — only ${todayWeekday} (today) and the weekend dates above are precomputed.
    When the guest asks for available rooms without naming a date, use today (${today}) as find_room.date.
    Never invent years or dates from training data (e.g. never use 2023). Pass only absolute YYYY-MM-DD to date tools.
    If working memory or earlier turns have a different check-in/out, overwrite them when the latest message uses relative dates.
    Check-in and check-out must be on or after ${today} unless the guest explicitly gave a past date.
  `;
};

/** Prepend CURRENT DATE so it is not buried under long static prompts. */
export const withCurrentDateInstructions = (basePrompt: string): string =>
  `${buildCurrentDateInstructions()}

${basePrompt}`;
