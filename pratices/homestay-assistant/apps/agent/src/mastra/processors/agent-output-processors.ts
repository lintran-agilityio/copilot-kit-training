import { AGENT_STEP_LIMIT } from "@repo/constants";

import { AgentStepLimitProcessor } from "./agent-step-limit.processor";

/** Output processors that run after each LLM step in the agentic loop. */
export const agentOutputProcessors = [
  new AgentStepLimitProcessor({ limit: AGENT_STEP_LIMIT }),
];
