import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
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

export const findRoomTool = createTool({
  id: TOOL_KEYS.GET.FIND_ROOM,
  description:
    `REQUIRED for room search/filter and date availability (including "show available rooms" / "what\'s available").
    Call find_room when the guest searches by room name and/or filters by date, guests, or room level, or asks for available rooms.
    Pass purpose: "search" (or omit) for find/show, "recommend" for soft-book without a named room,`,
  inputSchema: findRoomInputSchema,
  outputSchema: findRoomOutputSchema,
  execute: async (inputData, context) => {
    throwIfAborted(context.abortSignal);
    // inputSchema already runs normalizeFindRoomInput
    return findRooms(inputData, serviceContextFromTool(context));
  },
  toModelOutput: toFindRoomModelOutput,
});
