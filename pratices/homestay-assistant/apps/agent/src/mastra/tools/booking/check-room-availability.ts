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
    "Check whether a room is free for dates AND whether guests fit room.capacity. Always pass guests from the LATEST user message (not an earlier turn). Returns available, guestsWithinCapacity, and full room. If guestsWithinCapacity is false or available is false, do NOT call confirm_booking or show_booking_unavailable — BookingUnavailableModal renders automatically from this result; reply in chat explaining capacity or dates; optionally getAvailableRooms when dates are taken. If available is true, call confirm_booking with result.room + dates + the same guests — wait for confirmed: true before createBooking. Do not call getRoomById in a book turn. Always call this before confirm_booking.",
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input) => checkRoomAvailability(input),
});
