"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_URLS } from "@repo/constants";
import {
  discardInFlightAssistantTurn,
  getTrailingAssistantMessageId,
  requestRuntimeAgentStop,
  stopGeneration,
} from "@/features/chat/utils/agent-run";

type UseStopGenerationOptions = {
  agentId: string;
};

/** How long to keep re-trimming a stopped turn if Intelligence reconnect replays it. */
const STOPPED_TURN_SUPPRESS_MS = 5_000;

/**
 * Stop the current agent generation (Square button in CopilotChat input).
 * Cancels only this thread's in-flight run and drops the incomplete assistant
 * turn so the chat is not left with a mid-stream fragment.
 */
export const useStopGeneration = ({ agentId }: UseStopGenerationOptions) => {
  const { agent } = useAgent({ agentId });
  const { copilotkit } = useCopilotKit();
  const suppressedAssistantIdsRef = useRef<Set<string>>(new Set());
  const suppressTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const suppressAssistantTurn = useCallback(
    (assistantMessageId: string | undefined) => {
      if (!assistantMessageId) {
        return;
      }

      suppressedAssistantIdsRef.current.add(assistantMessageId);
      discardInFlightAssistantTurn(agent, assistantMessageId);

      const existingTimeout = suppressTimeoutsRef.current.get(assistantMessageId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        suppressedAssistantIdsRef.current.delete(assistantMessageId);
        suppressTimeoutsRef.current.delete(assistantMessageId);
      }, STOPPED_TURN_SUPPRESS_MS);

      suppressTimeoutsRef.current.set(assistantMessageId, timeout);
    },
    [agent],
  );

  // Intelligence run-activity reconnect can replay the stopped turn after we
  // trim locally. Keep discarding that message id briefly so the fragment
  // cannot stick.
  useEffect(() => {
    for (const assistantMessageId of suppressedAssistantIdsRef.current) {
      if (agent.messages.some((message) => message.id === assistantMessageId)) {
        discardInFlightAssistantTurn(agent, assistantMessageId);
      }
    }
  }, [agent, agent.messages]);

  useEffect(() => {
    const timeouts = suppressTimeoutsRef.current;

    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  const handleStopGeneration = useCallback(() => {
    const threadId = agent.threadId;
    const inFlightAssistantId = getTrailingAssistantMessageId(agent.messages);

    // TEMP: remove once first-click Stop is confirmed fixed.
    console.info("[StopDebug] click", {
      threadId,
      isRunning: agent.isRunning,
      inFlightAssistantId,
      messageCount: agent.messages.length,
    });

    // Do not gate on agent.isRunning: CopilotChat can keep the Stop affordance
    // visible across brief isRunning flickers (tool gaps / reconnect). An
    // early return made the first click a no-op and required a second click.
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
      () => suppressAssistantTurn(inFlightAssistantId),
    );
  }, [agent, agentId, copilotkit, suppressAssistantTurn]);

  return {
    stopGeneration: handleStopGeneration,
    isGenerating: agent.isRunning,
  };
};
