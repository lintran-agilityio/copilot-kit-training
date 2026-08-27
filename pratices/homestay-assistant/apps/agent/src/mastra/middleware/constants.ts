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
   * Confirmed stay from confirm_modify_booking confirmed:true — used to override
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
   * requestedCheckInDate/requestedCheckOutDate/requestedGuests captured from
   * the guest's own show_modify_dialog_select call (the picker for an
   * ambiguous MODIFY match) — carried across the HITL pick pause so the
   * forced find_booking_by_id call that follows confirmed:true doesn't
   * depend on the model re-stating them several tool-calls later, several
   * turns removed from the guest's original wording. See step-machine's
   * pinModifyBookingId.
   */
  PENDING_MODIFY_REQUESTED_FIELDS: "pendingModifyRequestedFields",
  /**
   * Optional {checkInDate, checkOutDate} pinned before get_room_by_id forces
   * open the Booking Form for a named-room BOOK resolution — sourced
   * deterministically from the latest dated find_room (search/recommend)
   * earlier in the conversation, so the form prefills that date instead of
   * defaulting to today. Guest can still edit it before booking.
   */
  PENDING_BOOKING_FORM_STAY_HINT: "pendingBookingFormStayHint",
  /**
   * {roomId, checkInDate, guests} pinned before check_room_availability is
   * forced (flow=create) for a named-room BOOK resolution once find_room
   * (book_resolve) resolves the room AND the check-in date + guest count are
   * both already known (stated this turn or from an earlier dated/guest-count
   * find_room) — used to override stale/incorrect LLM args deterministically,
   * the same way PENDING_MODIFY_CANDIDATE does for modify. checkOutDate is
   * intentionally not pinned: only the model's own args (or the +1 day
   * default) carry a guest-stated stay length.
   */
  PENDING_CREATE_CANDIDATE: "pendingCreateCandidate",
  /**
   * Deterministic workflow hint ('book' | 'modify' | 'cancel') detected from
   * the incoming request's own [book-stay]/[book-form]/[booking-cancel]/
   * [booking-modify] tag (see @repo/constants/prompt-tags and
   * detectPromptFlowHint) — read by buildHomestayAssistantPrompt to skip the
   * OTHER workflow playbook sections that tag guarantees are irrelevant this
   * turn. Undefined for any untagged/free-text message — full prompt, no
   * behavior change.
   */
  PROMPT_FLOW_HINT: "promptFlowHint",
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
