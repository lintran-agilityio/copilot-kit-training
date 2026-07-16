// Libs
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import { checkRoomAvailabilityTool } from "@/mastra/tools/booking/check-room-availability";
import {
  createBookingTool,
  cancelBookingTool,
  findBookingByIdTool,
  getBookingsTool,
} from "@/mastra/tools/booking";
import { getAvailableRoomsTool, getRoomByIdTool } from "@/mastra/tools/rooms";
import { bookingAgentPrompt } from "@/mastra/constants/prompts";
import { BOOKING_WORKING_MEMORY_TEMPLATE } from "@/mastra/constants/working-memory";

export const bookingAgent = new Agent({
  id: AGENT_KEYS.BOOKING_ASSISTANT,
  name: "Booking Agent",
  description:
    "Booking specialist for creating bookings, confirming booking drafts, listing bookings, and cancellation flows.",
  instructions: bookingAgentPrompt,
  model: "openai/gpt-4o-mini",
  tools: {
    createBooking: createBookingTool,
    getBookings: getBookingsTool,
    checkRoomAvailability: checkRoomAvailabilityTool,
    cancelBooking: cancelBookingTool,
    findBookingById: findBookingByIdTool,
    getAvailableRooms: getAvailableRoomsTool,
    getRoomById: getRoomByIdTool,
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
