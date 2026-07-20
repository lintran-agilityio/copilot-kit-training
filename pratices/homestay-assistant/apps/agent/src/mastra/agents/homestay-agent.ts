import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import {
  homeStayAgentPrompt,
  withCurrentDateInstructions,
} from "@/mastra/utils";
import { BOOKING_WORKING_MEMORY_TEMPLATE } from "@/mastra/constants/working-memory";

import {
  findRoomTool,
  getRoomsTool,
  getRoomByIdTool,
} from "@/mastra/tools/rooms";

export const homestayAgent = new Agent({
  id: AGENT_KEYS.HOMESTAY_ASSISTANT,

  name: "Homestay Agent",
  description:
    "Room specialist for browsing rooms, searching/filtering rooms, and opening room details.",

  instructions: () => withCurrentDateInstructions(homeStayAgentPrompt),

  model: "openai/gpt-4o-mini",

  tools: {
    getRoomById: getRoomByIdTool,
    getRooms: getRoomsTool,
    find_room: findRoomTool,
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