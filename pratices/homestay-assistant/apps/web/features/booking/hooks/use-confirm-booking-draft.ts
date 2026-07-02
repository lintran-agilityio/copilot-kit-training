"use client";

import { useCallback } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, BOOKING_CONFIRM_PROMPT_PREFIX } from "@repo/constants";

import { useBooking } from "@/features/booking/hooks";

const BOOKING_CONFIRM_MESSAGE = `${BOOKING_CONFIRM_PROMPT_PREFIX} User confirmed the booking draft in the room detail drawer. Read Current draft booking and Signed-in user from context. Call createBooking, then sync_booking_result with the result.`;

export const useConfirmBookingDraft = () => {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const setSubmitStatus = useBooking((state) => state.setSubmitStatus);

  return useCallback(async () => {
    if (copilotkit.runtimeConnectionStatus !== "connected") {
      setSubmitStatus("error", "Chat is not connected. Try again in a moment.");
      return;
    }

    setSubmitStatus("submitting");

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
  }, [agent, copilotkit, setSubmitStatus]);
};
