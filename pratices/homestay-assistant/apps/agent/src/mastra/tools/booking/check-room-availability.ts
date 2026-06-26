// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  checkRoomAvailabilityInputSchema,
  checkRoomAvailabilityOutputSchema,
} from "../../schemas/booking";
import { checkRoomAvailability } from "../../../services/booking.services";

export const checkRoomAvailabilityTool = createTool({
  id: TOOL_KEYS.BOOKING.CHECK_AVAILABILITY,
  description:
    "Check whether a room is available for a check-in and check-out date range. Always call this before update_booking_form.",
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input) => checkRoomAvailability(input),
});
