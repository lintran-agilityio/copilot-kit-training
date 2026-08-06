"use client";

import { useEffect } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import {
  isExpectedAgentError,
  isStopRelatedRunErrorEvent,
} from "@/features/chat/utils/agent-run";

type UseSilenceStopRunErrorsOptions = {
  agentId: string;
};

type RunErrorEventLike = {
  code?: string;
  message?: string;
};

type AgentErrorSubscriber = {
  onRunErrorEvent?: (params: {
    event?: RunErrorEventLike;
  }) => void | Promise<void>;
  [key: string]: unknown;
};

type PatchableAgent = {
  threadId?: string;
  connectAgent?: (
    params: unknown,
    subscriber?: AgentErrorSubscriber,
  ) => Promise<unknown>;
  runAgent?: (
    params: unknown,
    subscriber?: AgentErrorSubscriber,
  ) => Promise<unknown>;
};

const wrapErrorSubscriber = (
  subscriber: AgentErrorSubscriber | undefined,
): AgentErrorSubscriber | undefined => {
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

      await originalOnRunErrorEvent(params);
    },
  };
};

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
    const patchable = agent as PatchableAgent;
    const originalConnectAgent = patchable.connectAgent?.bind(patchable);
    const originalRunAgent = patchable.runAgent?.bind(patchable);

    if (originalConnectAgent) {
      patchable.connectAgent = (params, subscriber) =>
        originalConnectAgent(params, wrapErrorSubscriber(subscriber));
    }

    if (originalRunAgent) {
      patchable.runAgent = async (params, subscriber) => {
        try {
          return await originalRunAgent(
            params,
            wrapErrorSubscriber(subscriber),
          );
        } catch (error) {
          // Follow-up run after Stop often hits Intelligence 409 while the
          // old lock is still held. Swallow so AbstractAgent's "Agent
          // execution failed" path does not leave a user-facing failure.
          if (
            isExpectedAgentError(
              error,
              undefined,
              undefined,
              patchable.threadId,
            )
          ) {
            return undefined;
          }

          throw error;
        }
      };
    }

    return () => {
      if (originalConnectAgent) {
        patchable.connectAgent = originalConnectAgent;
      }
      if (originalRunAgent) {
        patchable.runAgent = originalRunAgent;
      }
    };
  }, [agent]);
};
