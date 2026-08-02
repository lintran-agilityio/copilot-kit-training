// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  checkRoomAvailabilityInputSchema,
  checkRoomAvailabilityOutputSchema,
  type CheckRoomAvailabilityOutput,
} from "@/mastra/schemas/booking";
import { checkRoomAvailability } from "@/mastra/services";
import { getBusinessDates } from "@repo/utils/date";

export const checkRoomAvailabilityTool = createTool({
  id: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
  description:
    "Check room dates and guest capacity before booking. Always pass flow: use flow=create for a NEW stay (omit excludeBookingId); use flow=modify only after edit_modify_booking returns confirmed:true and always pass excludeBookingId=bookingId. Use absolute YYYY-MM-DD dates and the guest count from the latest message. The result includes mandatory nextAction + flow: call confirm_booking only for create, confirm_modify_booking only for modify, or stop when stop_booking. Never answer only that the room is available and never call create_booking/update_booking before confirmation.",
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input) => {
    console.log("----CHECK ROOM AVAILABILITY TOOL EXECUTED----");
    const { today } = getBusinessDates();

    if (input.checkInDate < today) {
      throw new Error(`checkInDate must be on or after today (${today})`);
    }

    if (input.checkOutDate <= input.checkInDate) {
      throw new Error(
        `checkOutDate ${input.checkOutDate} must be after checkInDate ${input.checkInDate}. Today is ${today}.`,
      );
    }

    const flow: CheckRoomAvailabilityOutput["flow"] =
      input.flow ??
      (input.excludeBookingId?.trim() ? "modify" : "create");
    const isModify = flow === "modify";

    if (isModify && !input.excludeBookingId?.trim()) {
      throw new Error(
        "excludeBookingId is required when flow is modify",
      );
    }

    const result = await checkRoomAvailability({
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      guests: input.guests,
      ...(isModify && input.excludeBookingId
        ? { excludeBookingId: input.excludeBookingId }
        : {}),
    });

    const nextAction: CheckRoomAvailabilityOutput["nextAction"] =
      result.available && result.guestsWithinCapacity
        ? isModify
          ? "confirm_modify_booking"
          : "confirm_booking"
        : "stop_booking";

    return {
      ...result,
      nextAction,
      flow,
    };
  },
});
