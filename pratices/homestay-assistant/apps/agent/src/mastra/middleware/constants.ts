import { THREAD_METADATA_BLOCKED_MESSAGE_IDS } from "@repo/constants";

export const REQUEST_CONTEXT_KEYS = {
  AUTH: "auth",
  BLOCKED_MESSAGE_IDS: THREAD_METADATA_BLOCKED_MESSAGE_IDS,
  /**
   * Candidate stay from edit_modify_booking confirmed:true — used to override
   * check_room_availability args when the model fills stale dates.
   */
  PENDING_MODIFY_CANDIDATE: "pendingModifyCandidate",
  /**
   * Pre-change stay for stated-modify fast path — bookingId plus original
   * checkInDate / checkOutDate / guests so confirm UI can show old → new.
   */
  PENDING_MODIFY_ORIGINAL: "pendingModifyOriginal",
  /**
   * Confirmed stay from CONFIRM_MODIFY_BOOKING confirmed:true — used to override
   * update_booking args when the model fills stale dates.
   */
  PENDING_UPDATE_STAY: "pendingUpdateStay",
  /**
   * Confirmed stay from confirm_booking confirmed:true — used to override
   * create_booking args when the model fills stale dates.
   */
  PENDING_CREATE_STAY: "pendingCreateStay",
  /**
   * Booking id from show_cancel_dialog_confirm confirmed:true — used to override
   * cancel_booking args when the model fills a stale id from an earlier turn.
   */
  PENDING_CANCEL_BOOKING_ID: "pendingCancelBookingId",
  /**
   * Booking id from show_modify_dialog_select confirmed:true — used to override
   * find_booking_by_id args when the model fills a stale id from an earlier turn.
   */
  PENDING_MODIFY_BOOKING_ID: "pendingModifyBookingId",
  /**
   * Deterministic LIST_MY_BOOKINGS override is active for this turn — get_bookings
   * must ignore focused roomId and cancel/modify pins.
   */
  LIST_MY_BOOKINGS_ACTIVE: "listMyBookingsActive",
  /**
   * Optional YYYY-MM-DD pinned for get_bookings.onDate when LIST_MY_BOOKINGS
   * parsed a date cue (e.g. "at 15" → 2026-08-15). Null/undefined = no date filter.
   */
  LIST_MY_BOOKINGS_ON_DATE: "listMyBookingsOnDate",
  /**
   * Optional YYYY-MM-DD range start pinned for get_bookings when LIST_MY_BOOKINGS
   * parsed a "weekend" cue (e.g. "at weekend" → Saturday). Null/undefined = no
   * range filter. Paired with LIST_MY_BOOKINGS_DATE_TO.
   */
  LIST_MY_BOOKINGS_DATE_FROM: "listMyBookingsDateFrom",
  /**
   * Optional YYYY-MM-DD range end (exclusive) pinned alongside
   * LIST_MY_BOOKINGS_DATE_FROM — together they scope get_bookings results to
   * stays overlapping that span (e.g. the weekend's Saturday+Sunday).
   */
  LIST_MY_BOOKINGS_DATE_TO: "listMyBookingsDateTo",
  /**
   * Deterministic CANCEL_WITHOUT_BOOKING_ID override is active — get_bookings
   * should apply pinned onDate and cancel-disambiguation replyHint.
   */
  CANCEL_WITHOUT_BOOKING_ID_ACTIVE: "cancelWithoutBookingIdActive",
  /**
   * Optional YYYY-MM-DD pinned for get_bookings.onDate when cancel-without-id
   * parsed a date cue (e.g. "cancel room at 15th" → 2026-08-15).
   */
  CANCEL_WITHOUT_BOOKING_ID_ON_DATE: "cancelWithoutBookingIdOnDate",
  /**
   * Optional room-name query pinned for cancel-without-id so get_bookings can
   * filter to the named room (e.g. "Orchid Twin Loft") before HITL.
   */
  CANCEL_WITHOUT_BOOKING_ID_ROOM_QUERY: "cancelWithoutBookingIdRoomQuery",
  /**
   * Deterministic MODIFY_WITHOUT_BOOKING_ID override is active — get_bookings
   * should apply pinned onDate and modify-disambiguation replyHint.
   */
  MODIFY_WITHOUT_BOOKING_ID_ACTIVE: "modifyWithoutBookingIdActive",
  /**
   * Optional YYYY-MM-DD pinned for get_bookings.onDate when modify-without-id
   * parsed a date cue (e.g. "modify room at 15th" → 2026-08-15).
   */
  MODIFY_WITHOUT_BOOKING_ID_ON_DATE: "modifyWithoutBookingIdOnDate",
  /**
   * Optional room-name query pinned for modify-without-id so get_bookings can
   * filter to the named room (e.g. "Heritage Master Suite") before HITL.
   */
  MODIFY_WITHOUT_BOOKING_ID_ROOM_QUERY: "modifyWithoutBookingIdRoomQuery",
} as const;

export const CLERK_TOKEN_HEADER = "x-clerk-token";

/** Guest-facing 401 messages from middleware auth (JWT / userId validation). */
export const AUTH_ERRORS = {
  REQUIRED: "Authentication required",
  TOKEN_EXPIRED: "Token expired",
  INVALID_TOKEN: "Invalid token",
  INVALID_USER: "Invalid user",
} as const;

export type AuthErrorMessage = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS];

export const AUTH_ERROR_MESSAGES: ReadonlySet<string> = new Set(
  Object.values(AUTH_ERRORS),
);
