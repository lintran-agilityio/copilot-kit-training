import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import {
  AGENT_KEYS,
  AGENT_MEMORY_LAST_MESSAGES,
  TOOL_KEYS,
} from "@repo/constants";
import {
  homestayAssistantPrompt,
  withCurrentDateInstructions,
} from "@/mastra/utils";
import { BOOKING_WORKING_MEMORY_TEMPLATE } from "@/mastra/constants";
import {
  cancelBookingTool,
  checkRoomAvailabilityTool,
  createBookingTool,
  findBookingByIdTool,
  getBookingsTool,
  updateBookingTool,
} from "@/mastra/tools/booking";
import {
  findRoomTool,
  getRoomByIdTool,
  getRoomsTool,
} from "@/mastra/tools/rooms";
import { agentOutputProcessors } from "@/mastra/processors/agent-output-processors";
import { securityInputProcessor } from "@/mastra/processors/security-input.processors";
import { BookingFormPrefillProcessor } from "@/mastra/processors/booking-form-prefill.processor";

export const homestayAssistant = new Agent({
  id: AGENT_KEYS.HOMESTAY_ASSISTANT,
  name: "Homestay Assistant",
  description:
    "Public chat agent that coordinates room discovery and booking flows (prompt-guided tool routing + HITL).",
  instructions: () => withCurrentDateInstructions(homestayAssistantPrompt),
  model: process.env.AI_MODEL || "openai/gpt-4o-mini",
  // Rate-limit responses are transient; Mastra applies bounded backoff retries.
  maxRetries: 2,
  tools: {
    [TOOL_KEYS.GET.ROOMS]: getRoomsTool,
    [TOOL_KEYS.GET.FIND_ROOM]: findRoomTool,
    [TOOL_KEYS.BOOKING.GET_ROOM_BY_ID]: getRoomByIdTool,
    [TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY]: checkRoomAvailabilityTool,
    [TOOL_KEYS.BOOKING.CREATE_BOOKING]: createBookingTool,
    [TOOL_KEYS.BOOKING.UPDATE_BOOKING]: updateBookingTool,
    [TOOL_KEYS.BOOKING.GET]: getBookingsTool,
    [TOOL_KEYS.BOOKING.FIND_BY_ID]: findBookingByIdTool,
    [TOOL_KEYS.BOOKING.CANCEL]: cancelBookingTool,
  },
  inputProcessors: [...securityInputProcessor, new BookingFormPrefillProcessor()],
  outputProcessors: [...agentOutputProcessors],
  memory: new Memory({
    options: {
      lastMessages: AGENT_MEMORY_LAST_MESSAGES,
      workingMemory: {
        enabled: true,
        scope: "thread",
        template: BOOKING_WORKING_MEMORY_TEMPLATE,
      },
    },
  }),
});
