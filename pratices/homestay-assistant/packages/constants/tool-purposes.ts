/**
 * `purpose` values passed to find_room / get_bookings / find_booking_by_id.
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
    /** BOOK name lookup only — Room List skipped when exactly 1 match. */
    BOOK_RESOLVE: "book_resolve",
    /** Internal room-name -> roomId lookup for cancel/modify with no bookingId — Room List always suppressed. */
    RESOLVE: "resolve",
  },
  GET_BOOKINGS: {
    /** Guest-facing show/list my bookings request, or default/omit. */
    LIST: "list",
    /** Internal lookup for a cancel/modify/change-room workflow with no bookingId — booking-list card always suppressed. */
    RESOLVE: "resolve",
  },
  FIND_BOOKING_BY_ID: {
    /** Allows any active booking, including one already checked in. Default when omitted. */
    CANCEL: "cancel",
    /** Additionally requires the stay not to have started yet. */
    MODIFY: "modify",
  },
} as const;

export type FindRoomPurpose =
  (typeof TOOL_PURPOSE.FIND_ROOM)[keyof typeof TOOL_PURPOSE.FIND_ROOM];
export type GetBookingsPurpose =
  (typeof TOOL_PURPOSE.GET_BOOKINGS)[keyof typeof TOOL_PURPOSE.GET_BOOKINGS];
export type FindBookingByIdPurpose =
  (typeof TOOL_PURPOSE.FIND_BOOKING_BY_ID)[keyof typeof TOOL_PURPOSE.FIND_BOOKING_BY_ID];

/** zod `.enum()` needs a non-empty tuple — derived from TOOL_PURPOSE so the values never drift apart. */
export const FIND_ROOM_PURPOSE_VALUES = Object.values(
  TOOL_PURPOSE.FIND_ROOM,
) as [FindRoomPurpose, ...FindRoomPurpose[]];
export const GET_BOOKINGS_PURPOSE_VALUES = Object.values(
  TOOL_PURPOSE.GET_BOOKINGS,
) as [GetBookingsPurpose, ...GetBookingsPurpose[]];
export const FIND_BOOKING_BY_ID_PURPOSE_VALUES = Object.values(
  TOOL_PURPOSE.FIND_BOOKING_BY_ID,
) as [FindBookingByIdPurpose, ...FindBookingByIdPurpose[]];
