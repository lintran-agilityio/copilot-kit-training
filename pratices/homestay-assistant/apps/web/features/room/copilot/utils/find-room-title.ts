import type { FindRoomResult } from "@/features/room/copilot/types/find-room";

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
