/**
 * MODIFY stated-change path: derive the authoritative confirm_modify_booking
 * stay straight from a resolved `find_booking_by_id` result, instead of
 * trusting the values the model re-transcribes into the forced
 * `confirm_modify_booking` HITL call.
 *
 * Why this exists: after `find_booking_by_id(purpose:"modify")` resolves the
 * relative check-out delta and probes availability, the booking step machine
 * forces `confirm_modify_booking`. That HITL call's args are model-authored,
 * and a weak model routinely copies the booking's ORIGINAL check-out into
 * `checkOutDate` (both the original and the probed date sit in the result),
 * or drops the `room` object. The confirm card then sees `original === next`,
 * `buildModifyChangeRows()` returns `[]`, and it hides itself as a no-op — the
 * guest gets the companion sentence ("Please review and confirm the changes.")
 * and no card. Reading the merged stay off `result.availability` (and the
 * original off `result.bookings[0]`) makes the card deterministic.
 */

export type ConfirmModifyStaySnapshot = {
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

export type ConfirmModifyStayResolution<TRoom> = {
  /** Resolved booking id, echoed off the result (not the model's args). */
  bookingId?: string;
  room?: TRoom;
  /** Merged stay the availability probe cleared (current stay + stated overrides). */
  proposed: ConfirmModifyStaySnapshot;
  /** Current booking stay, for the before → after diff. */
  original: ConfirmModifyStaySnapshot;
};

type FindBookingByIdResultLike<TRoom> = {
  bookings?: {
    bookingId?: string;
    checkInDate?: string;
    checkOutDate?: string;
    guests?: number;
  }[];
  room?: TRoom;
  availability?: {
    available?: boolean;
    guestsWithinCapacity?: boolean;
    checkInDate?: string;
    checkOutDate?: string;
    guests?: number;
  };
};

/**
 * Authoritative confirm_modify_booking stay for the MODIFY *stated-change*
 * path, read off one resolved `find_booking_by_id` result.
 *
 * Returns `null` when the result is not a free stated-change probe:
 *   - no `availability` block → no stated change (the edit form owns the turn), or
 *   - `available: false` / `guestsWithinCapacity: false` → the step machine
 *     stops the turn and BookingUnavailable renders — there is no confirm card.
 */
export const selectConfirmModifyStayFromResult = <TRoom>(
  result: FindBookingByIdResultLike<TRoom> | null | undefined,
  bookingId?: string,
): ConfirmModifyStayResolution<TRoom> | null => {
  const availability = result?.availability;
  if (
    !availability ||
    availability.available === false ||
    availability.guestsWithinCapacity === false
  ) {
    return null;
  }

  const wanted = bookingId?.trim();
  const booking =
    (wanted
      ? result?.bookings?.find((row) => row?.bookingId === wanted)
      : undefined) ?? result?.bookings?.[0];

  if (
    !booking?.checkInDate?.trim() ||
    !booking.checkOutDate?.trim() ||
    typeof booking.guests !== "number"
  ) {
    return null;
  }

  const proposed: ConfirmModifyStaySnapshot = {
    checkInDate: availability.checkInDate?.trim() || booking.checkInDate,
    checkOutDate: availability.checkOutDate?.trim() || booking.checkOutDate,
    guests:
      typeof availability.guests === "number"
        ? availability.guests
        : booking.guests,
  };

  return {
    bookingId: booking.bookingId?.trim() || undefined,
    room: result?.room,
    proposed,
    original: {
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guests: booking.guests,
    },
  };
};
