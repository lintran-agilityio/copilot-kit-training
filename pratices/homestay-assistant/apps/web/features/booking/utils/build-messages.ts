import {
  BOOKING_CANCEL_PROMPT_PREFIX,
  BOOKING_FORM_PROMPT_PREFIX,
  BOOKING_MODIFY_PROMPT_PREFIX,
  BOOKING_STAY_PROMPT_PREFIX,
} from "@repo/constants";
import { buildActionPrompt, formatShortDateForDisplay } from "@repo/utils";

import type { BookingResponse } from "@/features/booking/types/booking";

export type BuildBookingStayMessageArgs = {
  roomId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

/** Agent priority trigger: always runs availability → confirm_booking (never get_room_by_id). */
export const buildBookingStayMessage = ({
  roomId,
  roomName,
  checkInDate,
  checkOutDate,
  guests,
}: BuildBookingStayMessageArgs) => {
  const guestLabel = guests === 1 ? "1 guest" : `${guests} guests`;
  const display = `Book ${roomName} (${checkInDate} → ${checkOutDate}, ${guestLabel}).`;

  return `${BOOKING_STAY_PROMPT_PREFIX} roomId: ${roomId}. checkInDate: ${checkInDate}. checkOutDate: ${checkOutDate}. guests: ${guests}. ${display}`;
};

export const buildBookingFormMessage = (
  roomId: string,
  roomName: string,
  artifactId?: string,
) =>
  `${BOOKING_FORM_PROMPT_PREFIX} ${buildActionPrompt({
    action: "Show booking form for",
    targetName: roomName || "this room",
    identifiers: artifactId ? { roomId, artifactId } : { roomId },
  })}`;

export const buildBookingCancelMessage = (booking: BookingResponse) => {
  const room = booking.room!;
  const checkIn = formatShortDateForDisplay(booking.checkInDate);
  const checkOut = formatShortDateForDisplay(booking.checkOutDate);
  const display = `Please confirm cancellation of my booking for ${room.name} (${checkIn} → ${checkOut}).`;

  return `${BOOKING_CANCEL_PROMPT_PREFIX} bookingId: ${booking.id}. ${display}`;
};

export const buildBookingModifyMessage = (booking: BookingResponse) => {
  const { id, checkInDate, checkOutDate, guests } = booking;
  const room = booking.room!;
  const checkIn = formatShortDateForDisplay(checkInDate);
  const checkOut = formatShortDateForDisplay(checkOutDate);
  const display = `I want to modify my booking for ${room.name} (${checkIn} → ${checkOut}, ${guests} guests).`;

  return `${BOOKING_MODIFY_PROMPT_PREFIX} bookingId: ${id}. ${display}`;
};
