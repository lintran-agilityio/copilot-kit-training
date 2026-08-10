export type CreateStayCorrelationKeyInput = {
  roomId?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  guests?: number | null;
};

/**
 * Stable key correlating confirm_booking HITL with create_booking results.
 * Prefer exact key match; store falls back to latest pending when args drift.
 */
export const buildCreateStayCorrelationKey = (
  input: CreateStayCorrelationKeyInput,
): string | null => {
  const roomId = input.roomId?.trim();
  const checkInDate = input.checkInDate?.trim();
  const checkOutDate = input.checkOutDate?.trim();
  const guests = Number(input.guests);

  if (
    !roomId ||
    !checkInDate ||
    !checkOutDate ||
    !Number.isFinite(guests) ||
    guests <= 0
  ) {
    return null;
  }

  return `${roomId}|${checkInDate}|${checkOutDate}|${guests}`;
};
