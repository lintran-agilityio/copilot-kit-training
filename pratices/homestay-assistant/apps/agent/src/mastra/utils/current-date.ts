import { getBusinessDates } from "@repo/utils/date";

/** Prompt block with today + tomorrow so relative dates resolve correctly. */
export const buildDateContextPrompt = (now = new Date()): string => {
  const dates = getBusinessDates(now);

  return `## DATE CONTEXT
    Today: ${dates.todayWeekday}, ${dates.today} (${dates.timezone})
    Tomorrow: ${dates.tomorrow}
    This weekend: ${dates.weekendCheckIn} → ${dates.weekendCheckOut}
    Next weekend: ${dates.nextWeekendCheckIn} → ${dates.nextWeekendCheckOut}

    ## DATE RESOLUTION
    - Resolve relative dates to YYYY-MM-DD.
    - Use the precomputed weekend dates above.
    - Pass only YYYY-MM-DD to date fields/tools.
    - Latest user-provided date overrides earlier date state.
    - Current date is context only; it is not an implicit booking date.
  `;
};

/** Prepend CURRENT DATE so it is not buried under long static prompts. */
export const withDateContext = (basePrompt: string): string =>
  `${buildDateContextPrompt()}

${basePrompt}`;
