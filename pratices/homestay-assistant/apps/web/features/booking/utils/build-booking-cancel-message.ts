import {
  BOOKING_CANCEL_PROMPT_PREFIX,
} from "@repo/constants";
import { formatShortDateForDisplay } from "@repo/utils";

import type { BookingResponse } from "@/features/booking/types/booking";

export const buildBookingCancelMessage = (booking: BookingResponse) => {
  const room = booking.room!;
  const checkIn = formatShortDateForDisplay(booking.checkInDate);
  const checkOut = formatShortDateForDisplay(booking.checkOutDate);
  const display = `Please confirm cancellation of my booking for ${room.name} (${checkIn} → ${checkOut}).`;

  return `${BOOKING_CANCEL_PROMPT_PREFIX} bookingId: ${booking.id}. ${display}`;
};
