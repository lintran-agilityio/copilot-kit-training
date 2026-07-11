"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, BOOKING_CONFIRM_PROMPT_PREFIX } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { useBooking } from "@/features/booking/hooks";
import { useChatStore } from "@/features/assistant-ui/stores/chat-store";

const BOOKING_CONFIRM_MESSAGE = `${BOOKING_CONFIRM_PROMPT_PREFIX} User confirmed the booking draft in the room detail modal. Read Current draft booking and Signed-in user from context. Call createBooking, then sync_booking_result with the result.`;

export const useConfirmBookingDraft = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const setSubmitStatus = useBooking((state) => state.setSubmitStatus);
  const currentThreadIds = useChatStore((state) => state.currentThreadIds);
  const startNewThread = useChatStore((state) => state.startNewThread);

  return useCallback(async () => {
    if (!isLoaded || !user?.id) {
      setSubmitStatus("error", "Sign in before confirming a booking.");
      return;
    }

    if (copilotkit.runtimeConnectionStatus !== "connected") {
      setSubmitStatus("error", "Chat is not connected. Try again in a moment.");
      return;
    }

    setSubmitStatus("submitting");

    const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.MANAGE_ASSISTANT);
    agent.threadId = currentThreadIds[scopeKey] ?? startNewThread(scopeKey);

    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: BOOKING_CONFIRM_MESSAGE,
    });

    try {
      await copilotkit.runAgent({ agent });
    } catch (error) {
      setSubmitStatus(
        "error",
        error instanceof Error ? error.message : "Failed to confirm booking",
      );
    }
  }, [
    agent,
    copilotkit,
    currentThreadIds,
    isLoaded,
    setSubmitStatus,
    startNewThread,
    user?.id,
  ]);
};
