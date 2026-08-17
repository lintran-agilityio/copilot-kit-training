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
 * Reads a pinned booking id from request context.
 *
 * @param requestContext - Agent request context
 * @param key - Request-context key for the pinned booking id
 * @returns Trimmed booking id when present, otherwise null
 */
export const readPinnedBookingId = (
  requestContext: RequestContext | undefined,
  key: (typeof REQUEST_CONTEXT_KEYS)[keyof typeof REQUEST_CONTEXT_KEYS],
): string | null => {
  const value = requestContext?.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

/**
 * Reads a pinned stay and immediately clears it, so a tool's field-by-field
 * `pinned?.field ?? params.field` merge never has to pair its own read with a
 * matching clear call.
 *
 * @param requestContext - Agent request context
 * @param key - Request-context key for the pinned stay
 * @returns Confirmed stay when present and well-formed, otherwise null
 */
export const takePinnedStay = (
  requestContext: RequestContext | undefined,
  key: (typeof REQUEST_CONTEXT_KEYS)[keyof typeof REQUEST_CONTEXT_KEYS],
): ConfirmedStay | null => {
  const pinned = readPinnedStay(requestContext, key);
  clearPinnedStay(requestContext, key);
  return pinned;
};

/**
 * Reads a pinned booking id and immediately clears it — the booking-id
 * counterpart to {@link takePinnedStay}.
 *
 * @param requestContext - Agent request context
 * @param key - Request-context key for the pinned booking id
 * @returns Trimmed booking id when present, otherwise null
 */
export const takePinnedBookingId = (
  requestContext: RequestContext | undefined,
  key: (typeof REQUEST_CONTEXT_KEYS)[keyof typeof REQUEST_CONTEXT_KEYS],
): string | null => {
  const pinnedBookingId = readPinnedBookingId(requestContext, key);
  clearPinnedStay(requestContext, key);
  return pinnedBookingId;
};
