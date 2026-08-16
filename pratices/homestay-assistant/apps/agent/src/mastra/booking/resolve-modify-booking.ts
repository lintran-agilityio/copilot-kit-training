export type ModifyAvailabilityNextAction =
  | "CONFIRM_MODIFY_BOOKING"
  | "confirm_booking"
  | "stop_booking";

export type ResolveModifyAvailabilityNextActionInput = {
  available: boolean;
  guestsWithinCapacity: boolean;
  isModify: boolean;
  /** True when the candidate stay equals the pre-change originals. */
  stayUnchanged: boolean;
};

/**
 * Chooses nextAction after availability. Modify with a no-op candidate
 * (same as originals) must stop — never open CONFIRM_MODIFY_BOOKING.
 */
export const resolveModifyAvailabilityNextAction = ({
  available,
  guestsWithinCapacity,
  isModify,
  stayUnchanged,
}: ResolveModifyAvailabilityNextActionInput): ModifyAvailabilityNextAction => {
  if (isModify && stayUnchanged) {
    return "stop_booking";
  }

  if (available && guestsWithinCapacity) {
    return isModify ? "CONFIRM_MODIFY_BOOKING" : "confirm_booking";
  }

  return "stop_booking";
};
