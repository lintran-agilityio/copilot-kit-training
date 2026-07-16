"use client";

import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback } from "react";

import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId, buildActionPrompt } from "@repo/utils";
import { useChatStore } from "@/features/assistant-ui/stores/chat-store";


type OpenRoomDetailArgs = {
  roomId: string;
  roomName: string;
};

export const useRequestRoomDetail = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const currentThreadIds = useChatStore((state) => state.currentThreadIds);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );
  const startNewThread = useChatStore((state) => state.startNewThread);

  return useCallback(
    ({ roomId, roomName }: OpenRoomDetailArgs) => {
      if (!isLoaded || !user?.id || !roomId) {
        return;
      }

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.MANAGE_ASSISTANT);
      const threadId = currentThreadIds[scopeKey] ?? startNewThread(scopeKey);
      const message = buildActionPrompt({
        action: "Show detail room for",
        targetName: roomName || "this room",
        identifiers: {
          roomId,
        },
      });

      if (copilotkit.runtimeConnectionStatus === "connected") {
        agent.threadId = threadId;

        agent.addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: message,
        });

        void copilotkit.runAgent({ agent }).catch((error) => {
          console.error("Failed to open room detail in chat", error);
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
      user?.id,
      setPendingOutboundMessage,
      startNewThread,
    ],
  );
};
