import type { AgentTurnOptions } from "./agent-harness";
import { runAgentTurn } from "./agent-harness";
import { installFakeApi } from "./fake-api";
import { extractToolCalls, type EvalToolCall } from "./tool-calls";

export type CaseResult = {
  text: string;
  toolNames: string[];
  toolCalls: EvalToolCall[];
  threadId: string;
};

/**
 * Shared task body for every agent-turn eval: install the fixture API
 * (see `fake-api.ts` for why the mock boundary is `fetch`, not the agent or
 * its tools), run one real turn through the real agent, and always restore
 * `fetch` afterward — even a case that throws must not leak the stub into
 * the next one, since evalite runs cases with concurrency.
 */
export const runCase = async (
  message: string,
  options?: AgentTurnOptions,
): Promise<CaseResult> => {
  const fakeApi = installFakeApi();
  try {
    const { result, threadId } = await runAgentTurn(message, options);
    const toolCalls = extractToolCalls(result);
    return {
      text: result.text ?? "",
      toolNames: toolCalls.map((call) => call.toolName),
      toolCalls,
      threadId,
    };
  } finally {
    fakeApi.restore();
  }
};
