export type ModifyAvailabilityNextAction =
  | "confirm_modify_booking"
  | "confirm_booking"
  | "stop_booking";

export type ResolveModifyAvailabilityNextActionInput = {
  available: boolean;
  guestsWithinCapacity: boolean;
  isModify: boolean;
  /** True when the candidate stay equals the pre-change originals. */
  stayUnchanged: boolean;
};

export type ModifyStayFields = {
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

/**
 * Chooses nextAction after availability. Modify with a no-op candidate
 * (same as originals) must stop — never open confirm_modify_booking.
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

  if (!available && !guestsWithinCapacity) {
    return "stop_booking";
  }
  
  return isModify ? "confirm_modify_booking" : "confirm_booking";
};

/**
 * True when two stay snapshots share the same check-in, check-out, and guests.
 */
export const isSameModifyStay = (
  currentValue: ModifyStayFields,
  newValue: ModifyStayFields,
): boolean =>
  currentValue.checkInDate === newValue.checkInDate &&
  currentValue.checkOutDate === newValue.checkOutDate &&
  currentValue.guests === newValue.guests;
