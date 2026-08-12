import { BookingStatus } from "@repo/types";
import { parseToolResult } from "@repo/utils";
import { CancelBookingResult, CheckRoomAvailabilityResult, CreateBookingResult, UpdateBookingResult } from "../types";
import { BookingUnavailableReason } from "@repo/schemas";

export type BookingStatusMeta = {
  label: string;
  className: string;
};

const normalizeStatus = (status: string) => status.toUpperCase();

export const getBookingStatusMeta = (status: string): BookingStatusMeta => {
  switch (normalizeStatus(status)) {
    case BookingStatus.CONFIRMED.toUpperCase():
      return {
        label: "Confirmed",
        className:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
      };
    case BookingStatus.PENDING.toUpperCase():
      return {
        label: "Pending",
        className: "border-amber-500/30 bg-amber-500/15 text-amber-300",
      };
    case BookingStatus.CANCELLED.toUpperCase():
      return {
        label: "Cancelled",
        className: "border-zinc-500/30 bg-zinc-500/15 text-zinc-400",
      };
    default:
      return {
        label: status,
        className: "border-zinc-500/30 bg-zinc-500/15 text-zinc-400",
      };
  }
};

export const getAvailabilityFailureReason = (
  result?: CheckRoomAvailabilityResult | string | null,
): BookingUnavailableReason | null => {
  const parsed = parseToolResult<CheckRoomAvailabilityResult>(result);
  if (!parsed) {
    return null;
  }

  if (parsed.guestsWithinCapacity === false) {
    return "capacity_exceeded";
  }

  if (parsed.available === false) {
    return "dates_unavailable";
  }

  return null;
};

export const isCheckRoomAvailabilityFailure = (
  result?: CheckRoomAvailabilityResult | string | null,
) => getAvailabilityFailureReason(result) != null;

/**
 * True when BookingUnavailableNotice has every field it needs to draw a card.
 * Shared with the chat text-suppression rule so the two cannot drift apart.
 */
export const canRenderBookingUnavailableCard = (
  result?: CheckRoomAvailabilityResult | string | null,
) => {
  if (!isCheckRoomAvailabilityFailure(result)) {
    return false;
  }

  const parsed = parseToolResult<CheckRoomAvailabilityResult>(result);
  const guests = Number(parsed?.guests);

  return Boolean(
    parsed?.room?.name?.trim() &&
      parsed?.checkInDate?.trim() &&
      parsed?.checkOutDate?.trim() &&
      Number.isFinite(guests) &&
      guests > 0,
  );
};

export const isCancelBookingSuccess = (
  result?: CancelBookingResult | string | null,
) => {
  const parsed = parseToolResult<CancelBookingResult>(result);
  if (!parsed?.id) {
    return false;
  }

  return parsed.status?.toLowerCase() === BookingStatus.CANCELLED.toLowerCase();
};

/** True when createBooking returned a booking id (PENDING or CONFIRMED). */
export const isCreateBookingSuccess = (
  result?: CreateBookingResult | string | null,
) => {
  const parsed = parseToolResult<CreateBookingResult>(result);
  if (!parsed?.id) {
    return false;
  }

  if (!parsed.status) {
    return true;
  }

  const status = parsed.status.toLowerCase();
  return (
    status === BookingStatus.CONFIRMED.toLowerCase() ||
    status === BookingStatus.PENDING.toLowerCase()
  );
};

/** True when update_booking returned a booking id (still active). */
export const isUpdateBookingSuccess = (
  result?: UpdateBookingResult | string | null,
) => {
  const parsed = parseToolResult<UpdateBookingResult>(result);
  if (!parsed?.id) {
    return false;
  }

  if (!parsed.status) {
    return true;
  }

  return (
    parsed.status.toLowerCase() !== BookingStatus.CANCELLED.toLowerCase()
  );
};
