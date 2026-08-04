"use client";

import { useCallback } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_URLS } from "@repo/constants";
import {
  requestRuntimeAgentStop,
  stopGeneration,
} from "@/features/chat/utils/agent-run";

type UseStopGenerationOptions = {
  agentId: string;
};

/**
 * Stop the current agent generation (Square button in CopilotChat input).
 * Maps Idle/Generating UI to `agent.isRunning` via CopilotKit.
 */
export const useStopGeneration = ({ agentId }: UseStopGenerationOptions) => {
  const { agent } = useAgent({ agentId });
  const { copilotkit } = useCopilotKit();

  const handleStopGeneration = useCallback(() => {
    if (!agent.isRunning) {
      return;
    }

    const threadId = agent.threadId;

    stopGeneration(
      () => copilotkit.stopAgent({ agent }),
      () => agent.abortRun(),
      threadId
        ? () =>
            requestRuntimeAgentStop({
              runtimeUrl: AGENT_URLS.MANAGE_ASSISTANT,
              agentId,
              threadId,
              headers: copilotkit.headers,
            })
        : undefined,
    );
  }, [agent, agentId, copilotkit]);

  return {
    stopGeneration: handleStopGeneration,
    isGenerating: agent.isRunning,
  };
};
