// Libs
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { checkRoomAvailabilityTool } from "@/mastra/tools/booking/check-room-availability";
import {
  createBookingTool,
  cancelBookingTool,
  findBookingByIdTool,
  getBookingsTool,
} from "@/mastra/tools/booking";
import { findRoomTool, getRoomByIdTool } from "@/mastra/tools/rooms";
import { BOOKING_WORKING_MEMORY_TEMPLATE } from "@/mastra/constants";
import {
  bookingAgentPrompt,
  withCurrentDateInstructions,
} from "@/mastra/utils";

export const bookingAgent = new Agent({
  id: AGENT_KEYS.BOOKING_ASSISTANT,
  name: "Booking Agent",
  description:
    "Booking specialist for creating bookings, confirming booking drafts, listing bookings, and cancellation flows.",
  instructions: () => withCurrentDateInstructions(bookingAgentPrompt),
  model: "openai/gpt-4o-mini",
  tools: {
    [TOOL_KEYS.BOOKING.CREATE_BOOKING]: createBookingTool,
    [TOOL_KEYS.BOOKING.GET]: getBookingsTool,
    [TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY]: checkRoomAvailabilityTool,
    [TOOL_KEYS.BOOKING.CANCEL]: cancelBookingTool,
    [TOOL_KEYS.BOOKING.FIND_BY_ID]: findBookingByIdTool,
    [TOOL_KEYS.GET.FIND_ROOM]: findRoomTool,
    [TOOL_KEYS.BOOKING.GET_ROOM_BY_ID]: getRoomByIdTool,
  },
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        scope: "thread",
        template: BOOKING_WORKING_MEMORY_TEMPLATE,
      },
    },
  }),
});
