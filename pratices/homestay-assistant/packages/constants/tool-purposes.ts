/**
 * `purpose` values passed to find_room / resolve_booking_target.
 * Single source of truth for the string literals — Mastra input schemas,
 * Mastra-side suppression logic, and the FE Notice components all compare
 * against these instead of duplicating the raw strings.
 */
export const TOOL_PURPOSE = {
  FIND_ROOM: {
    /** FIND/filter a named room, or default/omit — Room List always shows when matches exist. */
    SEARCH: "search",
    /** Soft-book without a named room — Room List shows so the guest can pick. */
    RECOMMEND: "recommend",
  },
  RESOLVE_BOOKING_TARGET: {
    /** Allows any active booking, including one already checked in. */
    CANCEL: "cancel",
    /** Additionally requires the stay not to have started yet; may suspend for stay-change input. */
    MODIFY: "modify",
  },
} as const;

export type FindRoomPurpose =
  (typeof TOOL_PURPOSE.FIND_ROOM)[keyof typeof TOOL_PURPOSE.FIND_ROOM];
export type ResolveBookingTargetPurpose =
  (typeof TOOL_PURPOSE.RESOLVE_BOOKING_TARGET)[keyof typeof TOOL_PURPOSE.RESOLVE_BOOKING_TARGET];

/** zod `.enum()` needs a non-empty tuple — derived from TOOL_PURPOSE so the values never drift apart. */
export const FIND_ROOM_PURPOSE_VALUES = Object.values(
  TOOL_PURPOSE.FIND_ROOM,
) as [FindRoomPurpose, ...FindRoomPurpose[]];
export const RESOLVE_BOOKING_TARGET_PURPOSE_VALUES = Object.values(
  TOOL_PURPOSE.RESOLVE_BOOKING_TARGET,
) as [ResolveBookingTargetPurpose, ...ResolveBookingTargetPurpose[]];
