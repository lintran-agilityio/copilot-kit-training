import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { AGENT_KEYS } from "@repo/constants";
import { manageAgentPrompt } from "../constants/prompts";
import {
  cancelBookingTool,
  checkRoomAvailabilityTool,
  createBookingTool,
  findBookingByRoomTool,
  getBookingsTool,
} from "../tools/booking";
import {
  getAvailableRoomsTool,
  getRoomByIdTool,
  getRoomByNameTool,
  getRoomsTool,
} from "../tools/rooms";
import { bookingAgent } from "./booking-agent";
import { homestayAgent } from "./homestay-agent";

export const manageAgent = new Agent({
  id: AGENT_KEYS.MANAGE_ASSISTANT,
  name: "Homestay Manager Agent",
  description:
    "Public chat agent that coordinates room discovery and booking workflows.",
  instructions: manageAgentPrompt,
  model: "openai/gpt-5-mini",
  agents: {
    homestayAgent,
    bookingAgent,
  },
  tools: {},
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        scope: "thread",
      },
    },
  }),
});
