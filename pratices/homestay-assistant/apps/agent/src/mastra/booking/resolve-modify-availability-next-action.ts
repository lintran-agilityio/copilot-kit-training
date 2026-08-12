import type { ModifyStayFields } from "@/mastra/booking/modify-stay-fields";
import { isSameModifyStay } from "@/mastra/booking/modify-stay-fields";

export type ModifyAvailabilityNextAction =
  | "CONFIRM_MODIFY_BOOKING"
  | "confirm_booking"
  | "stop_booking";

export type ResolveModifyAvailabilityNextActionInput = {
  available: boolean;
  guestsWithinCapacity: boolean;
  isModify: boolean;
  candidate: ModifyStayFields;
  /** Pre-change stay when known (pinned originals). */
  original: ModifyStayFields | null;
};

/**
 * Chooses nextAction after availability. Modify with a no-op candidate
 * (same as originals) must stop — never open CONFIRM_MODIFY_BOOKING.
 */
export const resolveModifyAvailabilityNextAction = ({
  available,
  guestsWithinCapacity,
  isModify,
  candidate,
  original,
}: ResolveModifyAvailabilityNextActionInput): ModifyAvailabilityNextAction => {
  if (isModify && original && isSameModifyStay(candidate, original)) {
    return "stop_booking";
  }

  if (available && guestsWithinCapacity) {
    return isModify ? "CONFIRM_MODIFY_BOOKING" : "confirm_booking";
  }

  return "stop_booking";
};
