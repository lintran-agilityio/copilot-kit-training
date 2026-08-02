import type { RequestContext } from "@mastra/core/request-context";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import type { ConfirmedStay } from "@/mastra/utils/confirmed-stay";

/**
 * Reads a pinned confirmed stay from request context.
 *
 * @param requestContext - Agent request context
 * @param key - Request-context key for the pinned stay
 * @returns Confirmed stay when present and well-formed, otherwise null
 */
export const readPinnedStay = (
  requestContext: RequestContext | undefined,
  key: (typeof REQUEST_CONTEXT_KEYS)[keyof typeof REQUEST_CONTEXT_KEYS],
): ConfirmedStay | null => {
  if (!requestContext) {
    return null;
  }

  const value = requestContext.get(key);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const stay = value as Partial<ConfirmedStay>;

  if (
    typeof stay.checkInDate !== "string" ||
    typeof stay.checkOutDate !== "string" ||
    typeof stay.guests !== "number" ||
    stay.guests <= 0
  ) {
    return null;
  }

  return {
    bookingId:
      typeof stay.bookingId === "string" ? stay.bookingId : undefined,
    roomId: typeof stay.roomId === "string" ? stay.roomId : undefined,
    checkInDate: stay.checkInDate,
    checkOutDate: stay.checkOutDate,
    guests: stay.guests,
  };
};

/**
 * Clears a pinned stay after the consuming tool has applied it.
 *
 * @param requestContext - Agent request context
 * @param key - Request-context key to clear
 */
export const clearPinnedStay = (
  requestContext: RequestContext | undefined,
  key: (typeof REQUEST_CONTEXT_KEYS)[keyof typeof REQUEST_CONTEXT_KEYS],
) => {
  requestContext?.set(key, undefined);
};
