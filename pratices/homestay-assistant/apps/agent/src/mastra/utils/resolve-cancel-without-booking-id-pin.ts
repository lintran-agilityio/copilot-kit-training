import type { RequestContext } from "@mastra/core/request-context";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";

/**
 * Reads CANCEL_WITHOUT_BOOKING_ID pins set by Mastra prepareStep.
 * Same pattern as LIST_MY_BOOKINGS pins — server tool prefers pinned onDate.
 */
export const readCancelWithoutBookingIdPin = (
  requestContext: RequestContext | undefined,
): { active: boolean; onDate?: string } => {
  if (!requestContext) {
    return { active: false };
  }

  const active =
    requestContext.get(REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ACTIVE) ===
    true;
  const pinnedOnDate = requestContext.get(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ON_DATE,
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
 * Clears CANCEL_WITHOUT_BOOKING_ID pins after get_bookings has consumed them.
 */
export const clearCancelWithoutBookingIdPin = (
  requestContext: RequestContext | undefined,
) => {
  requestContext?.set(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ACTIVE,
    undefined,
  );
  requestContext?.set(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ON_DATE,
    undefined,
  );
};
