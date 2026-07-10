// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  checkRoomAvailabilityInputSchema,
  checkRoomAvailabilityOutputSchema,
} from "@/mastra/schemas/booking";
import { checkRoomAvailability } from "@/mastra/services";

export const checkRoomAvailabilityTool = createTool({
  id: TOOL_KEYS.BOOKING.CHECK_AVAILABILITY,
  description:
    "Check whether a room is free for dates AND whether guests fit room.capacity. Always pass guests from the LATEST user message (not an earlier turn). Returns available, guestsWithinCapacity, and full room. If guestsWithinCapacity is false, tell the guest the room max (room.capacity) and do NOT call open_confirm_booking. If available is true, call open_confirm_booking with result.room + dates + the same guests. Do not call getRoomById or open_room_detail_drawer. Always call this before open_confirm_booking.",
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input) => checkRoomAvailability(input),
});
