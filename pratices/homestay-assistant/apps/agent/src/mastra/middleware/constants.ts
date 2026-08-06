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
