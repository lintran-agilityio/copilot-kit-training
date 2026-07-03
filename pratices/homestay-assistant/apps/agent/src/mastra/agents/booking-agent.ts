// Libs
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import { checkRoomAvailabilityTool } from "../tools/booking/check-room-availability";
import {
  createBookingTool,
  cancelBookingTool,
  getBookingsTool,
} from "../tools/booking";
import { bookingAgentPrompt } from "../constants/prompts";

export const bookingAgent = new Agent({
  id: AGENT_KEYS.BOOKING_ASSISTANT,
  name: "Booking Agent",
  instructions: bookingAgentPrompt,
  model: "openai/gpt-5-mini",
  tools: {
    createBooking: createBookingTool,
    getBookings: getBookingsTool,
    checkRoomAvailability: checkRoomAvailabilityTool,
    cancelBooking: cancelBookingTool,
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
