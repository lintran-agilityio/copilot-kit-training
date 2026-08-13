import {
  parseToolResult,
  buildActionPrompt,
  formatShortDateForDisplay,
} from "@repo/utils";

import { getFailureMessage, MODEL_NAME } from "@/features/booking/constants";
import type {
  CancelBookingResult,
  CreateBookingResult,
  UpdateBookingResult,
  BookingResponse,
} from "@/features/booking/types";
import {
  BOOKING_CANCEL_PROMPT_PREFIX,
  BOOKING_FORM_PROMPT_PREFIX,
  BOOKING_MODIFY_PROMPT_PREFIX,
  BOOKING_STAY_PROMPT_PREFIX,
} from "@repo/constants";

type BookingErrorShape = {
  message?: unknown;
  error?: unknown;
  reason?: unknown;
};

export type BuildBookingStayMessageArgs = {
  roomId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

const readErrorField = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveFailureMessage = (result: unknown, fallback: string): string => {
  if (result == null) {
    return fallback;
  }

  if (typeof result === "string") {
    const parsed = parseToolResult<BookingErrorShape>(result);
    if (parsed && typeof parsed === "object") {
      return (
        readErrorField(parsed.message) ??
        readErrorField(parsed.error) ??
        readErrorField(parsed.reason) ??
        fallback
      );
    }

    const trimmed = result.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  const shape = result as BookingErrorShape;
  return (
    readErrorField(shape.message) ??
    readErrorField(shape.error) ??
    readErrorField(shape.reason) ??
    fallback
  );
};

/** Guest-facing reason when create_booking completes without a success payload. */
export const getCreateBookingFailureMessage = (
  result?: CreateBookingResult | string | null,
): string =>
  resolveFailureMessage(result, getFailureMessage(MODEL_NAME.CREATE));

/** Guest-facing reason when cancel_booking completes without a success payload. */
export const getCancelBookingFailureMessage = (
  result?: CancelBookingResult | string | null,
): string =>
  resolveFailureMessage(result, getFailureMessage(MODEL_NAME.CANCEL));

/** Guest-facing reason when update_booking completes without a success payload. */
export const getModifyBookingFailureMessage = (
  result?: UpdateBookingResult | string | null,
): string =>
  resolveFailureMessage(result, getFailureMessage(MODEL_NAME.MODIFY));

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
