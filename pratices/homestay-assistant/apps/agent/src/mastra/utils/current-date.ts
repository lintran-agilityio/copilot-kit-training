import { getBusinessDates } from "@repo/utils/date";

/** Prompt block with today + tomorrow so relative dates resolve correctly. */
export const buildCurrentDateInstructions = (now = new Date()): string => {
  const { today, tomorrow, timezone } = getBusinessDates(now);

  return `## CURRENT DATE (authoritative — read first)
    Today is ${today} (YYYY-MM-DD, timezone ${timezone}).
    Tomorrow is ${tomorrow}.
    When the guest says relative dates (today, tomorrow, next Friday, in 3 days), convert them using these values.
    Examples: "tomorrow" → ${tomorrow}; "today" → ${today}.
    Never invent years or dates from training data (e.g. never use 2023). Pass only absolute YYYY-MM-DD to date tools.
    If working memory or earlier turns have a different check-in/out, overwrite them when the latest message uses relative dates.
    Check-in and check-out must be on or after ${today} unless the guest explicitly gave a past date.
  `;
};

/** Prepend CURRENT DATE so it is not buried under long static prompts. */
export const withCurrentDateInstructions = (basePrompt: string): string =>
  `${buildCurrentDateInstructions()}

${basePrompt}`;
