export const BOOKING_ERRORS = {
  NOT_FOUND: "Booking not found",
  NOT_FOUND_OR_INACTIVE: "Booking not found or no longer active",
  NOT_MODIFIABLE: "Booking can no longer be modified — the stay has already started",
  INVALID_ID: "Invalid booking ID",
};

/**
 * create / update / cancel mutation success: same-card HITL Generic UI is the
 * response — no duplicate chat confirmation. Failures still need short chat text.
 */
export const MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT =
  "After success, do NOT send chat text confirming the mutation or restating dates/guests/total/room — the same HITL card already shows success (tools-only is allowed). Still send short chat text only for mutation failures.";
