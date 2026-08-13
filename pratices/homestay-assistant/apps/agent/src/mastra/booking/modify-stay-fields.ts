import { addDaysYmd } from "@repo/utils";

/** Absolute stay fields the guest already stated in natural language. */
export type StatedModifyChanges = {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  /** Relative checkout shift, applied against the current booking checkout. */
  extendCheckoutByNights?: number;
};

export type ModifyStayFields = {
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

export type ResolvedBookingForStatedModify = {
  bookingId: string;
  roomId: string;
  capacity?: number;
  current: ModifyStayFields;
};

/**
 * True when two stay snapshots share the same check-in, check-out, and guests.
 */
export const isSameModifyStay = (
  a: ModifyStayFields,
  b: ModifyStayFields,
): boolean =>
  a.checkInDate === b.checkInDate &&
  a.checkOutDate === b.checkOutDate &&
  a.guests === b.guests;

/**
 * Applies stated fields over the current booking stay (no validation).
 * Relative extend applies to the current checkout when no absolute checkout was stated.
 */
export const applyStatedModifyStay = (
  current: ModifyStayFields,
  stated: StatedModifyChanges,
): ModifyStayFields => {
  let checkOutDate = stated.checkOutDate ?? current.checkOutDate;

  if (stated.extendCheckoutByNights != null && stated.checkOutDate == null) {
    checkOutDate = addDaysYmd(
      current.checkOutDate,
      stated.extendCheckoutByNights,
    );
  }

  return {
    checkInDate: stated.checkInDate ?? current.checkInDate,
    checkOutDate,
    guests: stated.guests ?? current.guests,
  };
};

/**
 * Merges stated fields over the current booking stay.
 * Returns null for invalid date order or when the merged stay is a no-op.
 */
export const mergeStatedModifyStay = (
  current: ModifyStayFields,
  stated: StatedModifyChanges,
): ModifyStayFields | null => {
  const next = applyStatedModifyStay(current, stated);

  if (next.checkOutDate <= next.checkInDate) {
    return null;
  }

  if (isSameModifyStay(next, current)) {
    return null;
  }

  return next;
};
