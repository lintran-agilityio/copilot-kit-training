import { getBusinessDates } from "@repo/utils/date";

/** Prompt block with today + tomorrow so relative dates resolve correctly. */
export const buildCurrentDateInstructions = (now = new Date()): string => {
  const {
    today,
    todayWeekday,
    tomorrow,
    weekendCheckIn,
    weekendCheckOut,
    timezone,
  } = getBusinessDates(now);

  return `## CURRENT DATE (authoritative — read first)
    Today is ${todayWeekday}, ${today} (YYYY-MM-DD, timezone ${timezone}).
    Tomorrow is ${tomorrow}.
    "This weekend" / "the weekend" / "cuối tuần" is ALWAYS check-in ${weekendCheckIn}, check-out ${weekendCheckOut}. Copy these two values verbatim — never compute a weekend yourself and never use ${tomorrow} for a weekend request.
    When the guest says relative dates (today, tomorrow, next Friday, in 3 days), convert them using these values.
    Examples: "tomorrow" → ${tomorrow}; "today" → ${today}; "this weekend" → ${weekendCheckIn} to ${weekendCheckOut}.
    Never derive a day of the week yourself — only ${todayWeekday} (today) and the weekend dates above are trustworthy.
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
