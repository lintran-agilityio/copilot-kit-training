"use client";

import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback } from "react";

import { AGENT_KEYS } from "@repo/constants";
import { getThreadResourceId } from "@repo/utils";

import { useChatStore } from "@/features/chat/stores/chat-store";

export const useRequestRoomBooking = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );
  const activeThreadId = useChatStore((state) => {
    if (!isLoaded || !user?.id) {
      return undefined;
    }

    const scopeKey = getThreadResourceId(user.id, AGENT_KEYS.HOMESTAY_ASSISTANT);
    return state.activeThreadIds[scopeKey];
  });

  return useCallback(
    (message = "Book this room") => {
      if (!isLoaded || !user?.id) {
        return;
      }

      const scopeKey = getThreadResourceId(user.id, AGENT_KEYS.HOMESTAY_ASSISTANT);

      if (
        activeThreadId &&
        copilotkit.runtimeConnectionStatus === "connected"
      ) {
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
      activeThreadId,
      agent,
      copilotkit,
      isLoaded,
      setPendingOutboundMessage,
      user?.id,
    ],
  );
};
