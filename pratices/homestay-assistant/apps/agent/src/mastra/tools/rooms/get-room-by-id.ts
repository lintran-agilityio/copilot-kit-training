import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoomByIdInputSchema } from "@repo/schemas";
import { addDaysYmd } from "@repo/utils";
import {
  clearBookingFormStayHint,
  readBookingFormStayHint,
} from "@/mastra/booking/book-form-prefill";
import { getRoom } from "@/mastra/services";
import {
  getRoomDetailOutputSchema,
  type GetRoomDetailOutput,
} from "@/mastra/schemas/rooms";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";
import {
  buildGetRoomByIdReplyHint,
} from "@/mastra/utils/generic-ui-reply-hints";

export { buildGetRoomByIdReplyHint } from "@/mastra/utils/generic-ui-reply-hints";

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
  description:
    "Fetch the complete room object by its unique roomId. Use only when the guest explicitly requests room details or when roomId is provided. Never use for search/filter requests. After calling: the Booking Form / Room Detail Generic UI is the response — do NOT send instructional chat that the form is open or how to use it (tools-only allowed). Still send short text for errors or clarifications the UI cannot collect. Do NOT echo previous find_room or search responses.",
  inputSchema: getRoomByIdInputSchema,
  outputSchema: getRoomDetailOutputSchema,
  execute: async (inputData, context) => {
    throwIfAborted(context.abortSignal);
    const { roomId, checkInDate, checkOutDate, guests: statedGuests } = inputData;
    const room = await getRoom(roomId, serviceContextFromTool(context));

    // The model states check-in/guests directly when the guest's latest
    // message named them; the continuity hint (a prior dated find_room in
    // this conversation) only fills in when the model didn't.
    const continuityHint = checkInDate
      ? null
      : readBookingFormStayHint(context.requestContext);
    clearBookingFormStayHint(context.requestContext);

    const resolvedCheckIn = checkInDate ?? continuityHint?.checkInDate;
    const resolvedCheckOut = checkInDate
      ? (checkOutDate ?? addDaysYmd(checkInDate, 1))
      : continuityHint?.checkOutDate;
    const rawGuests = statedGuests ?? continuityHint?.guests;
    const guests = rawGuests
      ? Math.min(Math.max(1, rawGuests), room.capacity)
      : undefined;

    if (!resolvedCheckIn && !guests) {
      return { room };
    }

    return {
      room: {
        ...room,
        ...(resolvedCheckIn && resolvedCheckOut
          ? { checkInDate: resolvedCheckIn, checkOutDate: resolvedCheckOut }
          : {}),
        ...(guests ? { guests } : {}),
      },
    };
  },
  toModelOutput: toGetRoomByIdModelOutput,
});
