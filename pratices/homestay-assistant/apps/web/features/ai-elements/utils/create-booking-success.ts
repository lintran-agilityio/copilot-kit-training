import { BookingStatus } from "@repo/types";
import { parseToolResult } from "@repo/utils";
import type { CreateBookingResult } from "@/features/ai-elements/type";

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
