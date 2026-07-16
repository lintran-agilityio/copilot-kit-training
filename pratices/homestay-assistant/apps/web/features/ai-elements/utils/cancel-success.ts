import { BookingStatus } from "@repo/types";
import { parseToolResult } from "@repo/utils";
import type { CancelBookingResult } from "@/features/ai-elements/type";

export const isCancelBookingSuccess = (
  result?: CancelBookingResult | string | null,
) => {
  const parsed = parseToolResult<CancelBookingResult>(result);
  if (!parsed?.id) {
    return false;
  }

  return parsed.status?.toLowerCase() === BookingStatus.CANCELLED.toLowerCase();
};
