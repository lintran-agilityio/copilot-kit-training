import { AGENT_STEP_LIMIT } from "@repo/constants";

import { AgentStepLimitProcessor } from "./agent-step-limit.processor";
import { SuppressBookingFormHandoffTextProcessor } from "./suppress-booking-form-handoff-text.processor";

/** Output processors that run after each LLM step in the agentic loop. */
export const agentOutputProcessors = [
  new SuppressBookingFormHandoffTextProcessor(),
  new AgentStepLimitProcessor({ limit: AGENT_STEP_LIMIT }),
];
