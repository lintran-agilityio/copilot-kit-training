"use client";

import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback } from "react";

import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { useChatStore } from "@/features/chat/stores/chat-store";

export const useRequestRoomBooking = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const currentThreadIds = useChatStore((state) => state.currentThreadIds);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );
  const startNewThread = useChatStore((state) => state.startNewThread);

  return useCallback(
    (message = "Book this room") => {
      if (!isLoaded || !user?.id) {
        return;
      }

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.HOMESTAY_ASSISTANT);
      const threadId = currentThreadIds[scopeKey] ?? startNewThread(scopeKey);

      if (copilotkit.runtimeConnectionStatus === "connected") {
        agent.threadId = threadId;

        agent.addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: message,
        });

        void copilotkit.runAgent({ agent }).catch((error) => {
          console.error("Failed to start booking workflow", error);
        });
        return;
      }

      setPendingOutboundMessage(scopeKey, message);
    },
    [
      agent,
      copilotkit,
      currentThreadIds,
      isLoaded,
      setPendingOutboundMessage,
      startNewThread,
      user?.id,
    ],
  );
};
