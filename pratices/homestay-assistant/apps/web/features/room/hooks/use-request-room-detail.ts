"use client";

import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback } from "react";

import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId, buildActionPrompt } from "@repo/utils";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import { runAgentSafely } from "@/features/chat/utils/agent-run";
import { rejectIfAgentRunning } from "@/features/chat/utils/reject-if-agent-running";
import { useThreadStore } from "@/features/threads/store/thread-store";

type OpenRoomDetailArgs = {
  roomId: string;
  roomName: string;
};

export const useRequestRoomDetail = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const activeThreadIds = useThreadStore((state) => state.activeThreadIds);
  const createDraftThread = useThreadStore((state) => state.createDraftThread);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  return useCallback(
    ({ roomId, roomName }: OpenRoomDetailArgs) => {
      if (!isLoaded || !user?.id || !roomId) {
        return;
      }

      if (rejectIfAgentRunning(agent.isRunning)) {
        return;
      }

      useHomestayAgentUiStore.getState().pushFocusedRoom(roomId);

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.MANAGE_ASSISTANT);
      const threadId =
        activeThreadIds[scopeKey] ?? createDraftThread(scopeKey);
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

        void runAgentSafely(
          () => copilotkit.runAgent({ agent }),
          (error) => {
            console.error("Failed to open room detail in chat", error);
          },
        );
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
      user?.id,
      setPendingOutboundMessage,
    ],
  );
};
