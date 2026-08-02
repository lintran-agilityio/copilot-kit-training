import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import {
  AGENT_KEYS,
  AGENT_STEP_LIMIT,
  AGENT_MEMORY_LAST_MESSAGES,
  AGENT_MAX_OUTPUT_TOKEN_LIMIT,
  TOOL_KEYS,
} from "@repo/constants";
import {
  enforceBookingWorkflowStep,
  manageAgentPrompt,
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
import { securityInputProcessor } from "@/mastra/processors/prompt-injection.processors";

export const manageAgent = new Agent({
  id: AGENT_KEYS.MANAGE_ASSISTANT,
  name: "Homestay Manager Agent",
  description:
    "Public chat agent that coordinates room discovery and booking workflows.",
  instructions: () => withCurrentDateInstructions(manageAgentPrompt),
  model: process.env.AI_MODEL || "openai/gpt-4o-mini",
  // Rate-limit responses are transient; Mastra applies bounded backoff retries.
  maxRetries: 2,
  defaultOptions: {
    maxSteps: AGENT_STEP_LIMIT,
    modelSettings: {
      maxOutputTokens: AGENT_MAX_OUTPUT_TOKEN_LIMIT,
    },
    // Prevent parallel tool calls: when the LLM emits a server-side tool and a
    // HITL frontend tool in the same step, the server tool resolves immediately
    // but the HITL call stays open waiting for user input. If the stream ends
    // before the HITL result returns, CopilotKit throws INCOMPLETE_STREAM.
    // Forcing sequential calls (one per step) eliminates this race condition.
    providerOptions: {
      openai: {
        parallelToolCalls: false,
      },
    },
    prepareStep: enforceBookingWorkflowStep,
  },
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
  inputProcessors: [...securityInputProcessor],
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
