import { parseToolResult } from "@repo/utils";
import type { CheckRoomAvailabilityResult } from "@/features/booking/copilot/types/check-availability";
import type { BookingUnavailableReason } from "@/features/booking/schemas";

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
