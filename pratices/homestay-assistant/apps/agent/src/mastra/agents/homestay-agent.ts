import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import { homeStayAgentPrompt } from "@/mastra/constants/prompts";
import { BOOKING_WORKING_MEMORY_TEMPLATE } from "@/mastra/constants/working-memory";

import {
  getRoomsTool,
  getAvailableRoomsTool,
  getRoomByIdTool,
} from "@/mastra/tools/rooms";

export const homestayAgent = new Agent({
  id: AGENT_KEYS.HOMESTAY_ASSISTANT,

  name: "Homestay Agent",
  description:
    "Room specialist for browsing rooms, checking available room lists, and opening room details.",

  instructions: homeStayAgentPrompt,

  model: "openai/gpt-4o-mini",

  tools: {
    getRoomById: getRoomByIdTool,
    getRooms: getRoomsTool,
    getAvailableRooms: getAvailableRoomsTool,
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