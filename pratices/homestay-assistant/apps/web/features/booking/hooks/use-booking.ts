"use client";

import { useCallback, useContext } from "react";
import { useStore } from "zustand";
import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";
import { BookingStore } from "@/features/booking/stores/booking-store";
import { BookingContext } from "@/features/booking/stores/booking-provider";
import type { BookingResponse } from "@/features/booking/types/booking";
import { buildBookingCancelMessage } from "@/features/booking/utils";
import { useChatStore } from "@/features/assistant-ui/stores/chat-store";

export const useBooking = <T>(selector: (state: BookingStore) => T): T => {
  const store = useContext(BookingContext);

  if (!store) {
    throw new Error("Booking context not found");
  }

  return useStore(store, selector);
};

export const useCancelBooking = () => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();

  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const currentThreadIds = useChatStore((state) => state.currentThreadIds);

  const startNewThread = useChatStore((state) => state.startNewThread);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  return useCallback(
    async (booking: BookingResponse) => {
      const room = booking.room;

      if (!isLoaded || !user?.id || !booking.id || !room) return;

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.MANAGE_ASSISTANT);
      const threadId = currentThreadIds[scopeKey] ?? startNewThread(scopeKey);
      const message = buildBookingCancelMessage(booking);

      if (copilotkit.runtimeConnectionStatus !== "connected") {
        setPendingOutboundMessage(scopeKey, message);
        return;
      }

      agent.threadId = threadId;
      agent.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      });

      copilotkit.runAgent({ agent }).catch((error) => {
        console.error("Failed to start cancel booking flow", error);
      });
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


