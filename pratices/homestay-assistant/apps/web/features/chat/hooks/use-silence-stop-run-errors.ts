"use client";

import { useEffect } from "react";
import { useAgent } from "@copilotkit/react-core/v2";
import type { AgentSubscriber, RunAgentResult } from "@ag-ui/client";

import {
  isExpectedAgentError,
  isStopRelatedRunErrorEvent,
} from "@/features/chat/utils/agent-run";

type UseSilenceStopRunErrorsOptions = {
  agentId: string;
};

const wrapErrorSubscriber = (
  subscriber: AgentSubscriber | undefined,
): AgentSubscriber | undefined => {
  if (!subscriber?.onRunErrorEvent) {
    return subscriber;
  }

  const originalOnRunErrorEvent = subscriber.onRunErrorEvent.bind(subscriber);

  return {
    ...subscriber,
    onRunErrorEvent: async (params) => {
      // Historical RUNNER_CONNECTION_DROPPED from an earlier Stop is replayed
      // on connect and must not surface as a live agent failure.
      if (isStopRelatedRunErrorEvent(params.event)) {
        return;
      }

      return originalOnRunErrorEvent(params);
    },
  };
};

const emptyRunResult = (): RunAgentResult => ({
  result: undefined,
  newMessages: [],
});

/**
 * Filters expected Stop / post-Stop errors out of CopilotKit's agent methods
 * so Stop does not open the red error banner or spam console failures.
 *
 * Part of the client Stop surface owned by `features/chat/utils/agent-run.ts`.
 */
export const useSilenceStopRunErrors = ({
  agentId,
}: UseSilenceStopRunErrorsOptions) => {
  const { agent } = useAgent({ agentId });

  useEffect(() => {
    const originalConnectAgent = agent.connectAgent.bind(agent);
    const originalRunAgent = agent.runAgent.bind(agent);

    agent.connectAgent = (parameters, subscriber) =>
      originalConnectAgent(parameters, wrapErrorSubscriber(subscriber));

    agent.runAgent = async (parameters, subscriber) => {
      try {
        return await originalRunAgent(
          parameters,
          wrapErrorSubscriber(subscriber),
        );
      } catch (error) {
        // Follow-up run after Stop often hits Intelligence 409 while the
        // old lock is still held. Swallow so AbstractAgent's "Agent
        // execution failed" path does not leave a user-facing failure.
        if (
          error instanceof Error &&
          isExpectedAgentError(error, undefined, undefined, agent.threadId)
        ) {
          return emptyRunResult();
        }

        throw error;
      }
    };

    return () => {
      agent.connectAgent = originalConnectAgent;
      agent.runAgent = originalRunAgent;
    };
  }, [agent]);
};
