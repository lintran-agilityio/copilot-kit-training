import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import { homeStayAgentPrompt } from "../constants/prompts";

import {
  cancelBookingTool,
  checkRoomAvailabilityTool,
  createBookingTool,
  findBookingByRoomTool,
  getBookingsTool,
} from "../tools/booking";

import {
  getRoomsTool,
  getAvailableRoomsTool,
  getRoomByIdTool,
  getRoomByNameTool,
} from "../tools/rooms";

export const homestayAgent = new Agent({
  id: AGENT_KEYS.HOMESTAY_ASSISTANT,

  name: "Homestay Agent",

  instructions: homeStayAgentPrompt,

  model: "openai/gpt-5-mini",

  tools: {
    getRoomByName: getRoomByNameTool,
    getRooms: getRoomsTool,
    getAvailableRooms: getAvailableRoomsTool,
    getRoomById: getRoomByIdTool,
    createBooking: createBookingTool,
    getBookings: getBookingsTool,
    checkRoomAvailability: checkRoomAvailabilityTool,
    cancelBooking: cancelBookingTool,
    findBookingByRoom: findBookingByRoomTool,
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
