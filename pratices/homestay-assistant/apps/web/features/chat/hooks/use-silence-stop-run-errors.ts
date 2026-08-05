"use client";

import { useEffect } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import { isStopRelatedRunErrorEvent } from "@/features/chat/utils/agent-run";

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
 * Filters stop/disconnect RUN_ERROR events out of CopilotKit's error
 * subscriber so Stop (and reconnect replay of a prior Stop) does not open
 * the red error banner or spam `[CopilotKit] Agent error`.
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
      patchable.runAgent = (params, subscriber) =>
        originalRunAgent(params, wrapErrorSubscriber(subscriber));
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
