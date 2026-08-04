"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import type { BookingResponse } from "@/features/booking/types/booking";
import {
  buildBookingCancelMessage,
  buildBookingModifyMessage,
} from "@/features/booking/utils";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { runAgentSafely } from "@/features/chat/utils/agent-run";
import { useThreadStore } from "@/features/threads/store/thread-store";

/** Selector hook over the module booking store. */
export const useBooking = useBookingStore;

const useBookingAgentAction = (
  buildMessage: (booking: BookingResponse) => string,
  label: string,
) => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();

  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const activeThreadIds = useThreadStore((state) => state.activeThreadIds);
  const createDraftThread = useThreadStore((state) => state.createDraftThread);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  return useCallback(
    async (booking: BookingResponse) => {
      const room = booking.room;

      if (!isLoaded || !user?.id || !booking.id || !room || agent.isRunning)
        return;

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.MANAGE_ASSISTANT);
      const threadId =
        activeThreadIds[scopeKey] ?? createDraftThread(scopeKey);
      const message = buildMessage(booking);

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

      void runAgentSafely(
        () => copilotkit.runAgent({ agent }),
        (error) => {
          console.error(`Failed to start ${label} flow`, error);
        },
      );
    },
    [
      agent,
      activeThreadIds,
      buildMessage,
      copilotkit,
      createDraftThread,
      label,
      isLoaded,
      user?.id,
      setPendingOutboundMessage,
    ],
  );
};

export const useCancelBooking = () =>
  useBookingAgentAction(buildBookingCancelMessage, "cancel booking");

export const useModifyBooking = () =>
  useBookingAgentAction(buildBookingModifyMessage, "modify booking");
