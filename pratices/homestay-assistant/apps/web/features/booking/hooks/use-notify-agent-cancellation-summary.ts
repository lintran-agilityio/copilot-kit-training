"use client";

import { useCallback } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";

export const useNotifyAgentCancellationSummary = () => {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });

  return useCallback(
    async (bookingId: string, roomName: string) => {
      if (copilotkit.runtimeConnectionStatus !== "connected") {
        return;
      }

      agent.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: [
          `Booking cancelled for ${roomName}.`,
          `Booking id: ${bookingId}.`,
          "Please provide a brief cancellation confirmation for the user.",
        ].join(" "),
      });

      await copilotkit.runAgent({ agent });
    },
    [agent, copilotkit],
  );
};
