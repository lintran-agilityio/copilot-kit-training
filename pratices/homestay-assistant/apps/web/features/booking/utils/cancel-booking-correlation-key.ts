/**
 * Stable key correlating show_cancel_dialog_confirm HITL with cancel_booking.
 * Prefer exact key match; store falls back to latest pending when args drift.
 */
export const buildCancelBookingCorrelationKey = (
  bookingId?: string | null,
): string | null => {
  const id = bookingId?.trim();
  return id ? id : null;
};
