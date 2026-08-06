import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoom } from "@/mastra/services";
import {
  getRoomDetailInputSchema,
  getRoomDetailOutputSchema,
  type GetRoomDetailOutput,
} from "@/mastra/schemas/rooms";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

/**
 * Slim payload for the model: only the fields needed for tool chaining.
 * Rich fields (description, imageUrl, amenities, pricePerNight) are omitted
 * so the LLM cannot re-list them in chat — the UI already renders the full
 * RoomDetail card. An explicit replyHint overrides any stale context-window
 * pattern (e.g. a previous find_room response).
 */
const toGetRoomByIdModelOutput = (output: GetRoomDetailOutput) => {
  const { room } = output;

  return {
    type: "json" as const,
    value: {
      roomId: room.id,
      name: room.name,
      capacity: room.capacity,
      replyHint:
        `Room detail / booking form is now open in the UI for "${room.name}". ` +
        `Reply with ONE short sentence only — invite the guest to select their dates and tap "Book this room". ` +
        `Do NOT repeat or reference any previous room list, find_room result, or search response. ` +
        `Do NOT list price, amenities, description, or any other room field — the UI already shows them.`,
    },
  };
};

export const getRoomByIdTool = createTool({
  id: TOOL_KEYS.BOOKING.GET_ROOM_BY_ID,
  description:
    "Fetch the complete room object by its unique roomId. Use only when the guest explicitly requests room details or when roomId is provided. Never use for search/filter requests. After calling: reply with ONE short sentence inviting the guest to select dates and tap 'Book this room'. Do NOT echo previous find_room or search responses.",
  inputSchema: getRoomDetailInputSchema,
  outputSchema: getRoomDetailOutputSchema,
  execute: async (inputData, context) => {
    throwIfAborted(context.abortSignal);
    const { roomId } = inputData;
    const room = await getRoom(roomId, serviceContextFromTool(context));
    return { room };
  },
  toModelOutput: toGetRoomByIdModelOutput,
});
