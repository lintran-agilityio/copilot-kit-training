import { Agent } from "@mastra/core/agent";

import { AGENT_KEYS } from "@repo/constants";

/**
 * CopilotKit suggestion provider.
 *
 * Intentionally has no Memory: SuggestionEngine sets `threadId` to a fresh
 * UUID per reload. A memory-backed provider would persist those as ghost
 * threads in mastra_threads. Chat history still comes from the consumer agent.
 */
export const suggestionAgent = new Agent({
  id: AGENT_KEYS.SUGGESTION_ASSISTANT,
  name: "Suggestion Agent",
  description:
    "Generates contextual chat suggestion pills. Does not own conversation memory.",
  instructions:
    "You only generate short follow-up suggestions via the copilotkitSuggest tool. Do not answer the guest as a chat assistant.",
  model: process.env.AI_MODEL || "openai/gpt-4o-mini",
  defaultOptions: {
    maxSteps: 3,
  },
});
