import type { FindBookingByRoomResult } from "@repo/types";

import type { FindBookingByRoomOutput } from "../../schemas/booking";

export const mapFindBookingByRoomResult = (
  result: FindBookingByRoomResult,
): FindBookingByRoomOutput => {
  if (result.status === "found") {
    return {
      status: "found",
      message: `Found booking for ${result.booking.roomName} (${result.booking.checkInDate} to ${result.booking.checkOutDate}).`,
      booking: result.booking,
    };
  }

  if (result.status === "ambiguous") {
    return {
      status: "ambiguous",
      message: result.message,
      candidates: result.bookings,
    };
  }

  return {
    status: "not_found",
    message: result.message,
  };
};
