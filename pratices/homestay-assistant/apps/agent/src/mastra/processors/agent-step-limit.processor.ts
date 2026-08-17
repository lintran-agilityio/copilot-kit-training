import type { ProcessOutputStepArgs, Processor } from "@mastra/core/processors";
import {
  AGENT_STEP_LIMIT_PROCESSOR_ID,
  AGENT_STEP_LIMIT_TRIPWIRE_REASON_PREFIX,
} from "@repo/constants";

export type AgentStepLimitProcessorOptions = {
  /** Maximum agent steps (0-indexed stepNumber must stay below this value). */
  limit: number;
  message?: string;
};

export class AgentStepLimitProcessor implements Processor {
  id = AGENT_STEP_LIMIT_PROCESSOR_ID;

  name = "Agent Step Limit";

  readonly #limit: number;

  readonly #message: string;

  constructor(options: AgentStepLimitProcessorOptions) {
    if (!Number.isFinite(options.limit) || options.limit < 1) {
      throw new Error("AgentStepLimitProcessor requires limit to be a positive number");
    }

    this.#limit = options.limit;
    this.#message =
      options.message ??
      `${AGENT_STEP_LIMIT_TRIPWIRE_REASON_PREFIX} (${options.limit}). Stopping further tool execution.`;
  }

  processOutputStep({
    messages,
    stepNumber,
    toolCalls,
    finishReason,
    abort,
  }: ProcessOutputStepArgs) {
    if (stepNumber < this.#limit) {
      return messages;
    }

    const hasPendingToolCalls =
      Boolean(toolCalls?.length) &&
      finishReason !== "error" &&
      finishReason !== "length" &&
      finishReason !== "content-filter";

    if (!hasPendingToolCalls) {
      return messages;
    }

    abort(this.#message);
    return messages;
  }
}
