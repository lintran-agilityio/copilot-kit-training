import { LUXURY_ROOM_LEVEL } from "@/mastra/constants";
import type { FindRoomInput } from "@repo/schemas";
import type { FindRoomOutput } from "@/mastra/schemas/rooms";
import { buildFindRoomReplyHint } from "./generic-ui-reply-hints";
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
export { buildFindRoomReplyHint } from "./generic-ui-reply-hints";

/**
 * Remaps mistaken `name` / relative `date` values so search hits the rooms API.
 *
 * @param input - Raw find_room tool args from the model
 * @param options.today - Optional YYYY-MM-DD for deterministic date resolution in tests
 * @returns Filters safe to send to the rooms API
 */
export const normalizeFindRoomInput = (
  input: FindRoomInput,
  options?: { today?: string },
): FindRoomInput => {
  const rawName = input.name?.trim();
  // Recover date cues the model stuffed into `name` before filler stripping
  // removes ordinals ("show available room at 16th" → date=YYYY-MM-DD).
  let date = sanitizeFindRoomDate(input.date, options?.today);
  if (!date && rawName) {
    date = sanitizeFindRoomDate(rawName, options?.today);
  }

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

  return {
    type: "json" as const,
    value: {
      matchCount,
      name: output.name,
      date: output.date,
      guests: output.guests,
      level: output.level,
      purpose: output.purpose,
      // IDs only — names are intentionally omitted so the model cannot list
      // them in chat text; the UI renders full room cards from the raw result.
      rooms: output.rooms.map((room) => ({ id: room.id })),
      replyHint: buildFindRoomReplyHint(matchCount, output.purpose),
    },
  };
};
