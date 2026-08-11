import type { RequestContext } from "@mastra/core/request-context";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";

/**
 * Reads LIST_MY_BOOKINGS pins set by Mastra prepareStep.
 * Same pattern as cancel/create stay pins — server tool ignores stale LLM args.
 */
export const readListMyBookingsPin = (
  requestContext: RequestContext | undefined,
): { active: boolean; onDate?: string } => {
  if (!requestContext) {
    return { active: false };
  }

  const active =
    requestContext.get(REQUEST_CONTEXT_KEYS.LIST_MY_BOOKINGS_ACTIVE) === true;
  const pinnedOnDate = requestContext.get(
    REQUEST_CONTEXT_KEYS.LIST_MY_BOOKINGS_ON_DATE,
  );

  return {
    active,
    onDate:
      typeof pinnedOnDate === "string" && pinnedOnDate.trim().length > 0
        ? pinnedOnDate.trim()
        : undefined,
  };
};

/**
 * Clears LIST_MY_BOOKINGS pins after get_bookings has consumed them.
 */
export const clearListMyBookingsPin = (
  requestContext: RequestContext | undefined,
) => {
  requestContext?.set(REQUEST_CONTEXT_KEYS.LIST_MY_BOOKINGS_ACTIVE, undefined);
  requestContext?.set(REQUEST_CONTEXT_KEYS.LIST_MY_BOOKINGS_ON_DATE, undefined);
};
