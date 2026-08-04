import {
  LUXURY_ROOM_LEVEL,
  ROOM_LEVEL_CATEGORY_WORD,
  ROOM_LEVEL_CATEGORY_WORD_GLOBAL,
  ROOM_NAME_FILLER,
} from "@/mastra/constants";
import type { FindRoomInput, FindRoomOutput } from "@/mastra/schemas/rooms";

/**
 * True when `name` is category language (luxury/top-floor), not a room title.
 * LLMs often put these in `name`, which returns zero API matches.
 */
const isRoomLevelCategoryName = (name: string): boolean => {
  if (!ROOM_LEVEL_CATEGORY_WORD.test(name)) {
    return false;
  }

  const residual = name
    .replace(ROOM_LEVEL_CATEGORY_WORD_GLOBAL, " ")
    .replace(ROOM_NAME_FILLER, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return residual.length === 0;
};

/**
 * Remaps category language mistakenly passed as `name` into `level`.
 *
 * @param input - Raw find_room tool args from the model
 * @returns Filters safe to send to the rooms API
 */
export const normalizeFindRoomInput = (input: FindRoomInput): FindRoomInput => {
  const name = input.name?.trim();
  if (!name || !isRoomLevelCategoryName(name)) {
    return input;
  }

  return {
    ...input,
    name: undefined,
    level: input.level ?? LUXURY_ROOM_LEVEL,
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
      : `Pass rooms[].id to update_room_list. Room cards are already rendered in chat — do NOT write room names, a numbered list, or any room details in your reply. Reply with ONE very short sentence only (e.g. "I found ${matchCount} room(s) matching your request."). Never list room names in text.`;

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
