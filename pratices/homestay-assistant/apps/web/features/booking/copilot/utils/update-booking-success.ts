import { BookingStatus } from "@repo/types";
import { parseToolResult } from "@repo/utils";
import type { UpdateBookingResult } from "@/features/booking/copilot/types";

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
