// Libs
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import { checkRoomAvailabilityTool } from "../tools/booking/check-room-availability";
import {
  createBookingTool,
  cancelBookingTool,
  findBookingByRoomTool,
  getBookingsTool,
} from "../tools/booking";
import { getAvailableRoomsTool, getRoomByIdTool } from "../tools/rooms";
import { bookingAgentPrompt } from "../constants/prompts";

export const bookingAgent = new Agent({
  id: AGENT_KEYS.BOOKING_ASSISTANT,
  name: "Booking Agent",
  description:
    "Booking specialist for creating bookings, confirming booking drafts, listing bookings, and cancellation flows.",
  instructions: bookingAgentPrompt,
  model: "openai/gpt-5-mini",
  tools: {
    createBooking: createBookingTool,
    getBookings: getBookingsTool,
    checkRoomAvailability: checkRoomAvailabilityTool,
    cancelBooking: cancelBookingTool,
    findBookingByRoom: findBookingByRoomTool,
    getAvailableRooms: getAvailableRoomsTool,
    getRoomById: getRoomByIdTool,
  },
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        scope: 'thread',
      },
    },
  }),
});
