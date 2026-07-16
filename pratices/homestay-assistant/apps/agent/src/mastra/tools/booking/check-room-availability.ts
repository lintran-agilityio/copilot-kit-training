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
    "Check whether a room is free for dates AND whether guests fit room.capacity. Always pass guests from the LATEST user message (not an earlier turn). Returns available, guestsWithinCapacity, and full room. If guestsWithinCapacity is false, call show_booking_unavailable (reason: capacity_exceeded, include room.capacity) — wait for the guest to close the modal, THEN reply in chat; do NOT call confirm_booking. If available is false for dates, call show_booking_unavailable (reason: dates_unavailable) — wait for modal close, THEN reply in chat; optionally getAvailableRooms. If available is true, call confirm_booking with result.room + dates + the same guests — wait for confirmed: true before createBooking. Do not call getRoomById or show_room_detail in a book turn. Always call this before confirm_booking.",
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input) => checkRoomAvailability(input),
});
