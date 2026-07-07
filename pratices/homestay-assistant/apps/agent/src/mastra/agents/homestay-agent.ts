import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import { homeStayAgentPrompt } from "../constants/prompts";

import {
  getRoomsTool,
  getAvailableRoomsTool,
  getRoomByIdTool,
  getRoomByNameTool,
} from "../tools/rooms";

export const homestayAgent = new Agent({
  id: AGENT_KEYS.HOMESTAY_ASSISTANT,

  name: "Homestay Agent",
  description:
    "Room specialist for browsing rooms, checking available room lists, and opening room details.",

  instructions: homeStayAgentPrompt,

  model: "openai/gpt-5-mini",

  tools: {
    getRoomByName: getRoomByNameTool,
    getRooms: getRoomsTool,
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
