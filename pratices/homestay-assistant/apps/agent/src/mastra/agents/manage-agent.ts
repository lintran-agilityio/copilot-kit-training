import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import { manageAgentPrompt } from "@/mastra/constants/prompts";
import { BOOKING_WORKING_MEMORY_TEMPLATE } from "@/mastra/constants/working-memory";
import {
  cancelBookingTool,
  checkRoomAvailabilityTool,
  createBookingTool,
  findBookingByIdTool,
  getBookingsTool,
} from "@/mastra/tools/booking";
import {
  getAvailableRoomsTool,
  getRoomByIdTool,
  getRoomsTool,
} from "@/mastra/tools/rooms";

export const manageAgent = new Agent({
  id: AGENT_KEYS.MANAGE_ASSISTANT,
  name: "Homestay Manager Agent",
  description:
    "Public chat agent that coordinates room discovery and booking workflows.",
  instructions: manageAgentPrompt,
  model: "openai/gpt-4o-mini",
  defaultOptions: {
    maxSteps: 10,
  },
  tools: {
    getRooms: getRoomsTool,
    getAvailableRooms: getAvailableRoomsTool,
    getRoomById: getRoomByIdTool,
    checkRoomAvailability: checkRoomAvailabilityTool,
    createBooking: createBookingTool,
    getBookings: getBookingsTool,
    findBookingById: findBookingByIdTool,
    cancelBooking: cancelBookingTool,
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