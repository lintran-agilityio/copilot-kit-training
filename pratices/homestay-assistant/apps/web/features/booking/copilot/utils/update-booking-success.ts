import { parseToolResult } from "@repo/utils";
import type { UpdateBookingResult } from "@/features/booking/copilot/types";

export const isUpdateBookingSuccess = (
  result?: UpdateBookingResult | string | null,
) => {
  const parsed = parseToolResult<UpdateBookingResult>(result);
  return Boolean(parsed?.id && parsed.checkInDate && parsed.checkOutDate);
};
