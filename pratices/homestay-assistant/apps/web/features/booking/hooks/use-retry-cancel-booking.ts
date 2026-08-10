"use client";

import { useCallback, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { getRetryMessage, MODEL_NAME } from "@/features/booking/constants";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { runAgentSafely } from "@/features/chat/utils/agent-run";
import { useThreadStore } from "@/features/threads/store/thread-store";

/**
 * Retry cancel after HITL failure: send a normal user message so the agent
 * decides whether to call cancel_booking again (never call the tool from UI).
 */
export const useRetryCancelBooking = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const requestInFlightRef = useRef(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const activeThreadIds = useThreadStore((state) => state.activeThreadIds);
  const createDraftThread = useThreadStore((state) => state.createDraftThread);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  const retryCancelBooking = useCallback(() => {
    if (
      !isLoaded ||
      !user?.id ||
      agent.isRunning ||
      requestInFlightRef.current
    ) {
      return;
    }

    const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.MANAGE_ASSISTANT);
    const threadId =
      activeThreadIds[scopeKey] ?? createDraftThread(scopeKey);
    const message = getRetryMessage(MODEL_NAME.CANCEL);

    if (copilotkit.runtimeConnectionStatus !== "connected") {
      setPendingOutboundMessage(scopeKey, message);
      return;
    }

    requestInFlightRef.current = true;
    setIsRetrying(true);
    agent.threadId = threadId;
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    });

    void runAgentSafely(
      () => copilotkit.runAgent({ agent }),
      (error) => {
        console.error("Failed to retry cancel booking", error);
      },
    ).finally(() => {
      requestInFlightRef.current = false;
      setIsRetrying(false);
    });
  }, [
    agent,
    activeThreadIds,
    copilotkit,
    createDraftThread,
    isLoaded,
    setPendingOutboundMessage,
    user?.id,
  ]);

  return { retryCancelBooking, isRetrying };
};
