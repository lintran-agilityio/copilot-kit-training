import { parseToolResult } from "@repo/utils";
import type { CheckRoomAvailabilityResult } from "@/features/ai-elements/type";
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

/**
 * Builds a short heading for findRoom chat results from applied filters.
 *
 * @param result - Parsed findRoom tool output
 * @returns Heading text for the room preview list
 */
export const buildFindRoomTitle = (result: FindRoomResult): string => {
  const parts: string[] = [];

  if (result.name?.trim()) {
    parts.push(`“${result.name.trim()}”`);
  }
  if (result.date?.trim()) {
    parts.push(result.date.trim());
  }
  if (typeof result.guests === "number") {
    parts.push(`${result.guests} guests`);
  }
  if (typeof result.level === "number") {
    parts.push(`level ${result.level}`);
  }

  if (parts.length === 0) {
    return "Room results";
  }

  return `Rooms · ${parts.join(" · ")}`;
};
