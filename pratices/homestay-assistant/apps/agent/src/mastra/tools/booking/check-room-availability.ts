// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  checkRoomAvailabilityInputSchema,
  checkRoomAvailabilityOutputSchema,
} from "@/mastra/schemas/booking";
import { checkRoomAvailability } from "@/mastra/services";
import { getBusinessDates } from "@repo/utils/date";

export const checkRoomAvailabilityTool = createTool({
  id: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
  description:
    "Check whether a room is free for dates AND whether guests fit room.capacity. Always pass absolute YYYY-MM-DD check-in/out resolved from CURRENT DATE / agent context today+tomorrow (never invent years like 2023). Always pass guests from the LATEST user message (not an earlier turn). Returns available, guestsWithinCapacity, and full room. CREATE flow: if available, call confirm_booking then create_booking — never pass excludeBookingId. MODIFY flow: always pass excludeBookingId = the booking being modified (rooms can have multiple bookings; exclude so the current booking does not conflict with itself); if available, call confirm_modify_booking then update_booking — never call confirm_booking or create_booking. If guestsWithinCapacity is false or available is false, do NOT call confirm_booking / confirm_modify_booking — BookingUnavailableModal renders automatically; reply in chat. Do not call get_room_by_id in a book/modify turn.",
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input) => {
    const { today } = getBusinessDates();

    if (input.checkInDate < today) {
      throw new Error(
        `checkInDate must be on or after today (${today})`,
      );
    }

    if (input.checkOutDate <= input.checkInDate) {
      throw new Error(
        `checkOutDate ${input.checkOutDate} must be after checkInDate ${input.checkInDate}. Today is ${today}.`,
      );
    }

    return await checkRoomAvailability(input);
  },
});
