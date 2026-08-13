"use client";

import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback, useRef, useState } from "react";

import {
  AGENT_KEYS,
  HOMESTAY_AGENT_TASK_STATUS,
  HOMESTAY_AGENT_TASK_TYPE,
} from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { runAgentSafely } from "@/features/chat/utils/agent-run";
import { rejectIfAgentRunning } from "@/features/chat/utils/reject-if-agent-running";
import { useThreadStore } from "@/features/threads/store/thread-store";

const BOOK_FLOW_KEY = "book-flow";

export const useRequestRoomBooking = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const requestInFlightRef = useRef(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const activeThreadIds = useThreadStore((state) => state.activeThreadIds);
  const createDraftThread = useThreadStore((state) => state.createDraftThread);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  const requestRoomBooking = useCallback(
    (message = "Book this room") => {
      if (!isLoaded || !user?.id || requestInFlightRef.current) {
        return;
      }

      if (rejectIfAgentRunning(agent.isRunning)) {
        return;
      }

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.MANAGE_ASSISTANT);
      const threadId =
        activeThreadIds[scopeKey] ?? createDraftThread(scopeKey);

      const { roomId } = useBookingStore.getState();
      if (roomId) {
        useHomestayAgentUiStore.getState().pushUiFocus({
          key: BOOK_FLOW_KEY,
          task: {
            type: HOMESTAY_AGENT_TASK_TYPE.BOOK,
            status: HOMESTAY_AGENT_TASK_STATUS.IN_PROGRESS,
          },
          focus: { type: "room", id: roomId },
        });
      }

      if (copilotkit.runtimeConnectionStatus === "connected") {
        requestInFlightRef.current = true;
        setIsRequesting(true);
        agent.threadId = threadId;

        agent.addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: message,
        });

        void runAgentSafely(
          () => copilotkit.runAgent({ agent }),
          (error) => {
            console.error("Failed to start booking flow", error);
          },
        ).finally(() => {
          requestInFlightRef.current = false;
          setIsRequesting(false);
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

  return {
    requestRoomBooking,
    isRequesting,
  };
};
