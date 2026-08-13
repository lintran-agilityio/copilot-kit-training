import type { RequestContext } from "@mastra/core/request-context";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";

export type CancelWithoutBookingIdPin = {
  active: boolean;
  onDate?: string;
  /** Normalized free-text room query when the guest named a room. */
  roomQuery?: string;
};

/**
 * Reads CANCEL_WITHOUT_BOOKING_ID pins set by Mastra prepareStep.
 * Same pattern as LIST_MY_BOOKINGS pins — server tool prefers pinned onDate.
 */
export const readCancelWithoutBookingIdPin = (
  requestContext: RequestContext | undefined,
): CancelWithoutBookingIdPin => {
  if (!requestContext) {
    return { active: false };
  }

  const active =
    requestContext.get(REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ACTIVE) ===
    true;
  const pinnedOnDate = requestContext.get(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ON_DATE,
  );
  const pinnedRoomQuery = requestContext.get(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ROOM_QUERY,
  );

  return {
    active,
    onDate:
      typeof pinnedOnDate === "string" && pinnedOnDate.trim().length > 0
        ? pinnedOnDate.trim()
        : undefined,
    roomQuery:
      typeof pinnedRoomQuery === "string" && pinnedRoomQuery.trim().length > 0
        ? pinnedRoomQuery.trim()
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
  requestContext?.set(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ROOM_QUERY,
    undefined,
  );
};

export type ModifyWithoutBookingIdPin = {
  active: boolean;
  onDate?: string;
  /** Normalized free-text room query when the guest named a room. */
  roomQuery?: string;
};

/**
 * Reads MODIFY_WITHOUT_BOOKING_ID pins set by Mastra prepareStep.
 * Same pattern as CANCEL_WITHOUT_BOOKING_ID pins — server tool prefers pinned onDate.
 */
export const readModifyWithoutBookingIdPin = (
  requestContext: RequestContext | undefined,
): ModifyWithoutBookingIdPin => {
  if (!requestContext) {
    return { active: false };
  }

  const active =
    requestContext.get(REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ACTIVE) ===
    true;
  const pinnedOnDate = requestContext.get(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ON_DATE,
  );
  const pinnedRoomQuery = requestContext.get(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ROOM_QUERY,
  );

  return {
    active,
    onDate:
      typeof pinnedOnDate === "string" && pinnedOnDate.trim().length > 0
        ? pinnedOnDate.trim()
        : undefined,
    roomQuery:
      typeof pinnedRoomQuery === "string" && pinnedRoomQuery.trim().length > 0
        ? pinnedRoomQuery.trim()
        : undefined,
  };
};

/**
 * Clears MODIFY_WITHOUT_BOOKING_ID pins after get_bookings has consumed them.
 */
export const clearModifyWithoutBookingIdPin = (
  requestContext: RequestContext | undefined,
) => {
  requestContext?.set(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ACTIVE,
    undefined,
  );
  requestContext?.set(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ON_DATE,
    undefined,
  );
  requestContext?.set(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ROOM_QUERY,
    undefined,
  );
};

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
