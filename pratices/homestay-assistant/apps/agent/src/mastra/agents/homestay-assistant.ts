import { Agent } from "@mastra/core/agent";
import { ProviderHistoryCompat } from "@mastra/core/processors";
import { Memory } from "@mastra/memory";

import {
  AGENT_KEYS,
  AGENT_MEMORY_LAST_MESSAGES,
  AGENT_MAX_OUTPUT_TOKEN_LIMIT,
  TOOL_KEYS,
} from "@repo/constants";
import { buildHomestayAssistantPrompt, withDateContext } from "@/mastra/utils";
import {
  AI_MODEL,
  BOOKING_WORKING_MEMORY_TEMPLATE,
  IS_CEREBRAS_MODEL,
} from "@/mastra/constants";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import type { PromptFlowHint } from "@/mastra/middleware/prompt-flow-hint";
import {
  cancelBookingTool,
  checkRoomAvailabilityTool,
  createBookingTool,
  findBookingByIdTool,
  findBookingsTool,
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
import { enforceBookingStep } from "@/mastra/booking/step-machine";
console.log("=== AI_MODEL ===", AI_MODEL);
export const homestayAssistant = new Agent({
  id: AGENT_KEYS.HOMESTAY_ASSISTANT,
  name: "Homestay Assistant",
  description:
    "Public chat agent that coordinates room discovery and booking flows (prompt-guided tool routing + HITL).",
  instructions: ({ requestContext }) =>
    withDateContext(
      buildHomestayAssistantPrompt(
        requestContext.get(REQUEST_CONTEXT_KEYS.PROMPT_FLOW_HINT) as
          | PromptFlowHint
          | undefined,
      ),
    ),
  model: AI_MODEL,
  // Rate-limit responses are transient; Mastra applies bounded backoff retries.
  maxRetries: 2,
  defaultOptions: {
    prepareStep: enforceBookingStep,
    modelSettings: {
      maxOutputTokens: AGENT_MAX_OUTPUT_TOKEN_LIMIT,
    },
  },
  tools: {
    [TOOL_KEYS.GET.ROOMS]: getRoomsTool,
    [TOOL_KEYS.GET.FIND_ROOM]: findRoomTool,
    [TOOL_KEYS.BOOKING.GET_ROOM_BY_ID]: getRoomByIdTool,
    [TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY]: checkRoomAvailabilityTool,
    [TOOL_KEYS.BOOKING.CREATE_BOOKING]: createBookingTool,
    [TOOL_KEYS.BOOKING.UPDATE_BOOKING]: updateBookingTool,
    [TOOL_KEYS.BOOKING.GET]: getBookingsTool,
    [TOOL_KEYS.BOOKING.FIND]: findBookingsTool,
    [TOOL_KEYS.BOOKING.FIND_BY_ID]: findBookingByIdTool,
    [TOOL_KEYS.BOOKING.CANCEL]: cancelBookingTool,
  },
  inputProcessors: [
    ...securityInputProcessor,
    new BookingFormPrefillProcessor(),
    // Cerebras only (gpt-oss-120b is a reasoning model). @ai-sdk/openai-compatible
    // serializes assistant `reasoning` parts from recalled history as
    // `reasoning_content`, which Cerebras's API rejects (HTTP 400,
    // "property 'messages.N.assistant.reasoning_content' is unsupported").
    // The built-in `cerebras-strip-reasoning-content` rule drops those parts
    // from the outbound prompt only (memory / UI keep the full trace). OpenAI
    // has no such history, so the processor is skipped there.
    ...(IS_CEREBRAS_MODEL ? [new ProviderHistoryCompat()] : []),
  ],
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
