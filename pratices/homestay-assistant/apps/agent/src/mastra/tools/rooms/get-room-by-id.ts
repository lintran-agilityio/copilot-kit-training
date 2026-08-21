import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoomByIdInputSchema } from "@repo/schemas";
import { getRoom } from "@/mastra/services";
import {
  getRoomDetailOutputSchema,
  type GetRoomDetailOutput,
} from "@/mastra/schemas/rooms";
import {
  serviceContextFromTool,
  throwIfAborted,
  resolveRoomStay,
  buildGetRoomByIdReplyHint
} from "@/mastra/utils";


/**
 * Slim payload for the model: only the fields needed for tool chaining.
 * Rich fields (description, imageUrl, amenities, pricePerNight) are omitted
 * so the LLM cannot re-list them in chat — the UI already renders the full
 * RoomDetail card. An explicit replyHint overrides any stale context-window
 * pattern (e.g. a previous find_room response).
 */
export const toGetRoomByIdModelOutput = (output: GetRoomDetailOutput) => {
  const { room } = output;

  return {
    type: "json" as const,
    value: {
      roomId: room.id,
      name: room.name,
      capacity: room.capacity,
      replyHint: buildGetRoomByIdReplyHint(room.name),
    },
  };
};

export const getRoomByIdTool = createTool({
  id: TOOL_KEYS.BOOKING.GET_ROOM_BY_ID,

  description: `
    Fetch a room by its unique roomId.

    Use when:
    - the guest explicitly requests details for a specific room
    - roomId is already known and the room must be resolved before continuing a booking flow

    Do not use for:
    - room search
    - room availability search
    - room filtering
    - room recommendations

    The UI renders the room detail or booking form from the tool result.
  `.trim(),

  inputSchema: getRoomByIdInputSchema,
  outputSchema: getRoomDetailOutputSchema,

  execute: async (input, context) => {
    throwIfAborted(context.abortSignal);

    const room = await getRoom(
      input.roomId,
      serviceContextFromTool(context),
    );

    const stay = resolveRoomStay(
      input,
      context.requestContext,
      room,
    );

    return {
      room: {
        ...room,
        ...stay,
      },
    };
  },

  toModelOutput: toGetRoomByIdModelOutput,
});
