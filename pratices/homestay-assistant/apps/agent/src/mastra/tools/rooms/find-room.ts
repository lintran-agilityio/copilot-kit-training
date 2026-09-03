import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";
import {
  findRoomInputSchema,
  findRoomOutputSchema,
} from "@/mastra/schemas/rooms";
import { findRooms } from "@/mastra/services";
import { toFindRoomModelOutput } from "@/mastra/utils";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

const NAME_ONLY_PURPOSES = new Set<string | undefined>([
  TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
  TOOL_PURPOSE.FIND_ROOM.RESOLVE,
]);

export const findRoomTool = createTool({
  id: TOOL_KEYS.GET.FIND_ROOM,
  description: `
    Find rooms matching the guest's request.

    Use when the guest:
    - searches for rooms
    - asks which rooms are available
    - filters rooms by name, date, guests, or room level
    - requests a booking for a specific named room

    Purpose:
    - search: find/show/filter rooms for the guest
    - book_resolve: resolve a specific named room for a booking flow
    - recommend: find suitable rooms when no specific room was requested
  `,
  strict: true,
  inputSchema: findRoomInputSchema,
  outputSchema: findRoomOutputSchema,
  execute: async (input, context) => {
    throwIfAborted(context.abortSignal);
    // inputSchema already runs normalizeFindRoomInput
    if (NAME_ONLY_PURPOSES.has(input.purpose)) {
      // date/guests on `input` here are stated hints only (see
      // normalizeFindRoomInput) — never let them filter a named-room lookup,
      // just echo them back for the BOOK step machine to route on.
      const result = await findRooms(
        { purpose: input.purpose, name: input.name },
        serviceContextFromTool(context),
      );
      return { ...result, date: input.date, guests: input.guests };
    }
    const result = await findRooms(input, serviceContextFromTool(context));
    // `limit` trims the search to the top N matches when the guest asked for a
    // specific count ("find me 3 rooms"). Applied here so both the chat cards
    // (FindRoomNotice reads the raw result) and the model's compare candidates
    // see the same trimmed set.
    return input.limit && input.limit < result.rooms.length
      ? { ...result, rooms: result.rooms.slice(0, input.limit) }
      : result;
  },
  toModelOutput: toFindRoomModelOutput,
});
