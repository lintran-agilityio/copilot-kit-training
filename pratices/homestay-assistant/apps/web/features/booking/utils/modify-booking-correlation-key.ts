export type ModifyStayCorrelationKeyInput = {
  bookingId?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  guests?: number | null;
};

/**
 * Stable key correlating confirm_modify_booking HITL with update_booking.
 * Prefer exact key match; store falls back to latest pending when args drift.
 */
export const buildModifyStayCorrelationKey = (
  input: ModifyStayCorrelationKeyInput,
): string | null => {
  const bookingId = input.bookingId?.trim();
  const checkInDate = input.checkInDate?.trim();
  const checkOutDate = input.checkOutDate?.trim();
  const guests = Number(input.guests);

  if (
    !bookingId ||
    !checkInDate ||
    !checkOutDate ||
    !Number.isFinite(guests) ||
    guests <= 0
  ) {
    return null;
  }

  return `${bookingId}|${checkInDate}|${checkOutDate}|${guests}`;
};
