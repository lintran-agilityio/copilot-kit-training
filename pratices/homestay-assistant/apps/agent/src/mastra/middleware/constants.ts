import { THREAD_METADATA_BLOCKED_MESSAGE_IDS } from "@repo/constants";

export const REQUEST_CONTEXT_KEYS = {
  AUTH: "auth",
  REQUEST_ID: "requestId",
  AGENT_ID: "agentId",
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
   * Deterministic CANCEL_WITHOUT_BOOKING_ID override is active — get_bookings
   * should apply pinned onDate and cancel-disambiguation replyHint.
   */
  CANCEL_WITHOUT_BOOKING_ID_ACTIVE: "cancelWithoutBookingIdActive",
  /**
   * Optional YYYY-MM-DD pinned for get_bookings.onDate when cancel-without-id
   * parsed a date cue (e.g. "cancel room at 15th" → 2026-08-15).
   */
  CANCEL_WITHOUT_BOOKING_ID_ON_DATE: "cancelWithoutBookingIdOnDate",
} as const;

export const CLERK_TOKEN_HEADER = "x-clerk-token";
export const AGENT_ID_HEADER = "x-agent-id";
