import { BookingStatus } from "@repo/types";
import { parseToolResult } from "@repo/utils";
import type { CreateBookingResult } from "@/features/ai-elements/type";

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

  return parsed.status.toLowerCase() === BookingStatus.CONFIRMED.toLowerCase();
};
