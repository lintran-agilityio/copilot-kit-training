import {
  THREAD_METADATA_BLOCKED_MESSAGE_IDS,
  THREAD_METADATA_BOOKING_DRAFT,
  THREAD_METADATA_STRUCTURED_SEARCH_CONTEXT,
} from "@repo/constants";

export const REQUEST_CONTEXT_KEYS = {
  AUTH: "auth",
  REQUEST_ID: "requestId",
  AGENT_ID: "agentId",
  BLOCKED_MESSAGE_IDS: THREAD_METADATA_BLOCKED_MESSAGE_IDS,
  /**
   * Authoritative Booking Draft for create/modify progressive collection.
   * Owned by request context (hydrated from thread metadata across turns).
   * Tools read/update this — never reconstruct stay fields from chat history.
   */
  BOOKING_DRAFT: THREAD_METADATA_BOOKING_DRAFT,
  /**
   * Last structured find_room filters (date/guests). Merge input only —
   * not a second copy of booking stay fields.
   */
  STRUCTURED_SEARCH_CONTEXT: THREAD_METADATA_STRUCTURED_SEARCH_CONTEXT,
  /**
   * Candidate stay from edit_modify_booking confirmed:true — used to override
   * check_room_availability args when the model fills stale dates.
   * Also pinned by the stated-change fast path (NL modify without edit form).
   */
  PENDING_MODIFY_CANDIDATE: "pendingModifyCandidate",
  /**
   * Pre-change stay snapshot for a modify flow — attached to availability
   * output so confirm_modify can show old → new diffs without relying on the LLM.
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
} as const;
export const CLERK_TOKEN_HEADER = "x-clerk-token";
export const AGENT_ID_HEADER = "x-agent-id";
