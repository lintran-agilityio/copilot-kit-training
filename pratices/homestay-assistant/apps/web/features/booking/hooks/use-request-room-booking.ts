"use client";

import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback } from "react";

import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { useChatStore } from "@/features/assistant-ui/stores/chat-store";
import { useThreadStore } from "@/features/threads/store/thread-store";

export const useRequestRoomBooking = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const activeThreadIds = useThreadStore((state) => state.activeThreadIds);
  const createDraftThread = useThreadStore((state) => state.createDraftThread);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  return useCallback(
    (message = "Book this room") => {
      if (!isLoaded || !user?.id) {
        return;
      }

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.MANAGE_ASSISTANT);
      const threadId =
        activeThreadIds[scopeKey] ?? createDraftThread(scopeKey);

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
      activeThreadIds,
      copilotkit,
      createDraftThread,
      isLoaded,
      setPendingOutboundMessage,
      user?.id,
    ],
  );
};
