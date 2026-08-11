import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import {
  AGENT_KEYS,
  AGENT_STEP_LIMIT,
  AGENT_MEMORY_LAST_MESSAGES,
  AGENT_MAX_OUTPUT_TOKEN_LIMIT,
  TOOL_KEYS,
} from "@repo/constants";
import { enforceBookingStep } from "@/mastra/booking/step-machine";
import {
  stopAfterBookingFormIteration,
  stopWhenBookingFormRendered,
  stopWhenStepLimitReached,
} from "@/mastra/booking/stop-after-booking-form";
import {
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
    "Public chat agent that coordinates room discovery and booking flows (step machine + HITL).",
  instructions: () => withCurrentDateInstructions(manageAgentPrompt),
  model: process.env.AI_MODEL || "openai/gpt-4o-mini",
  // Rate-limit responses are transient; Mastra applies bounded backoff retries.
  maxRetries: 2,
  defaultOptions: {
    // Do NOT set maxSteps here — Mastra replaces custom stopWhen with
    // stepCountIs(maxSteps) only. Keep the limit via stopWhen + processor.
    stopWhen: [
      stopWhenStepLimitReached(AGENT_STEP_LIMIT),
      stopWhenBookingFormRendered,
    ],
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
    prepareStep: enforceBookingStep,
    // Successful get_room_by_id / create|update|cancel_booking → BookingForm or
    // HITL success card is the response. Stop before a follow-up LLM confirmation
    // text step. Failures still continue so the model can send an error sentence.
    onIterationComplete: stopAfterBookingFormIteration,
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
