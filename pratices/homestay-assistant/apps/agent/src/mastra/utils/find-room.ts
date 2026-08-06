import { LUXURY_ROOM_LEVEL } from "@/mastra/constants";
import type { FindRoomInput, FindRoomOutput } from "@/mastra/schemas/rooms";
import { sanitizeFindRoomDate } from "./sanitize-find-room-date";
import {
  isCalendarOnlyRoomName,
  isRoomLevelCategoryName,
  sanitizeFindRoomName,
} from "./sanitize-find-room-name";

export {
  isCalendarOnlyRoomName,
  isRoomLevelCategoryName,
  residualRoomName,
  sanitizeFindRoomName,
} from "./sanitize-find-room-name";

export { sanitizeFindRoomDate } from "./sanitize-find-room-date";

/**
 * Remaps mistaken `name` / relative `date` values so search hits the rooms API.
 *
 * @param input - Raw find_room tool args from the model
 * @returns Filters safe to send to the rooms API
 */
export const normalizeFindRoomInput = (input: FindRoomInput): FindRoomInput => {
  const rawName = input.name?.trim();
  const date = sanitizeFindRoomDate(input.date);

  if (!rawName) {
    return date === input.date ? input : { ...input, date };
  }

  const wasCategory = isRoomLevelCategoryName(rawName);
  const name = sanitizeFindRoomName(rawName);

  if (
    name === rawName &&
    date === input.date &&
    !wasCategory &&
    !isCalendarOnlyRoomName(rawName)
  ) {
    return input;
  }

  return {
    ...input,
    name,
    date,
    ...(wasCategory ? { level: input.level ?? LUXURY_ROOM_LEVEL } : {}),
  };
};

/**
 * Slim payload for the model: keep ids for tool chaining, strip rich fields
 * so the LLM cannot dump descriptions/images that duplicate ListRoomPreview.
 */
export const toFindRoomModelOutput = (output: FindRoomOutput) => {
  const matchCount = output.rooms.length;
  const replyHint =
    matchCount === 0
      ? "No rooms matched. Reply with ONE short sentence that nothing matched and suggest changing name/date/guests/level. Do NOT invent rooms. Do NOT say rooms are ready to browse."
      : `Room cards are already rendered in chat — do NOT call find_room again this turn, do NOT call update_room_list, and do NOT write room names, a numbered list, or any room details in your reply. Reply with ONE very short sentence only (e.g. "I found ${matchCount} room(s) matching your request."). Never list room names in text.`;

  return {
    type: "json" as const,
    value: {
      matchCount,
      name: output.name,
      date: output.date,
      guests: output.guests,
      level: output.level,
      // IDs only — names are intentionally omitted so the model cannot list
      // them in chat text; the UI renders full room cards from the raw result.
      rooms: output.rooms.map((room) => ({ id: room.id })),
      replyHint,
    },
  };
};
