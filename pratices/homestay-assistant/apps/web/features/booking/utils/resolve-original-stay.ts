import type { ConfirmModifyBookingArgs } from "@/features/booking/schemas";
import type {
  ModifyStaySnapshot,
  PendingModifyStay,
} from "@/features/booking/types/booking";

/**
 * Prefer stashed pending-modify originals; fall back to original* args on the
 * confirm_modify tool call.
 */
export const resolveOriginalStay = (
  pending: PendingModifyStay | null | undefined,
  bookingId: string,
  args: ConfirmModifyBookingArgs,
): ModifyStaySnapshot | null => {
  if (pending?.bookingId === bookingId) {
    return pending.original;
  }

  if (
    args.originalCheckInDate?.trim() &&
    args.originalCheckOutDate?.trim() &&
    typeof args.originalGuests === "number" &&
    args.originalGuests > 0
  ) {
    return {
      checkInDate: args.originalCheckInDate,
      checkOutDate: args.originalCheckOutDate,
      guests: args.originalGuests,
    };
  }

  return null;
};
