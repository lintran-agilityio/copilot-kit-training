"use client";

import { useCallback } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";

import type { CreatedBooking } from "@/features/booking/types/booking";

export const useNotifyAgentBookingSummary = () => {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });

  return useCallback(
    async (booking: CreatedBooking, roomName: string) => {
      if (copilotkit.runtimeConnectionStatus !== "connected") {
        return;
      }

      agent.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: [
          `Booking completed for ${roomName}.`,
          `Booking id: ${booking.id}.`,
          `Dates: ${booking.checkInDate} to ${booking.checkOutDate}.`,
          `Guests: ${booking.guests}.`,
          "Please provide a brief confirmation summary for the user.",
        ].join(" "),
      });

      await copilotkit.runAgent({ agent });
    },
    [agent, copilotkit],
  );
};
