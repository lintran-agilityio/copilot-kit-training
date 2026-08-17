"use client";

import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback, useRef, useState } from "react";

import { AGENT_KEYS, HOMESTAY_AGENT_TASK_STATUS, HOMESTAY_AGENT_TASK_TYPE, MESSAGE_ROLE } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { useChatStore } from "@/features/chat/stores/chat-store";
import { useThreadStore } from "@/features/threads/store/thread-store";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import { runAgentSafely, rejectIfAgentRunning } from "@/features/chat/utils";
import { useBookingStore } from "../stores";
import { getRetryMessage, MODEL_NAME } from "../constants";

export type UseSendAgentMessageOptions = {
  /** Runs before the message is dispatched, e.g. to set UI focus for the flow. */
  onBeforeSend?: (scopeKey: string) => void;
  onError: (error: unknown) => void;
};

const BOOK_FLOW_KEY = "book-flow";

/**
 * Shared plumbing behind request/retry booking hooks: resolves the active
 * thread, falls back to a pending outbound message when disconnected, and
 * otherwise appends a user message and runs the agent.
 */
export const useSendAgentMessage = ({
  onBeforeSend,
  onError,
}: UseSendAgentMessageOptions) => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const requestInFlightRef = useRef(false);
  const [isSending, setIsSending] = useState(false);
  const activeThreadIds = useThreadStore((state) => state.activeThreadIds);
  const createDraftThread = useThreadStore((state) => state.createDraftThread);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  const sendMessage = useCallback(
    (message: string) => {
      if (!isLoaded || !user?.id || requestInFlightRef.current) {
        return;
      }

      if (rejectIfAgentRunning(agent.isRunning)) {
        return;
      }

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.HOMESTAY_ASSISTANT);
      const threadId =
        activeThreadIds[scopeKey] ?? createDraftThread(scopeKey);

      onBeforeSend?.(scopeKey);

      if (copilotkit.runtimeConnectionStatus !== "connected") {
        setPendingOutboundMessage(scopeKey, message);
        return;
      }

      requestInFlightRef.current = true;
      setIsSending(true);
      agent.threadId = threadId;

      agent.addMessage({
        id: crypto.randomUUID(),
        role: MESSAGE_ROLE.USER,
        content: message,
      });

      void runAgentSafely(() => copilotkit.runAgent({ agent }), onError).finally(
        () => {
          requestInFlightRef.current = false;
          setIsSending(false);
        },
      );
    },
    [
      agent,
      activeThreadIds,
      copilotkit,
      createDraftThread,
      isLoaded,
      onBeforeSend,
      onError,
      setPendingOutboundMessage,
      user?.id,
    ],
  );

  return { sendMessage, isSending };
};

// Request Booking
export const useRequestRoomBooking = () => {
  const { sendMessage, isSending } = useSendAgentMessage({
    onBeforeSend: () => {
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
    },
    onError: (error) => {
      console.error("Failed to start booking flow", error);
    },
  });

  const requestRoomBooking = useCallback(
    (message = "Book this room") => sendMessage(message),
    [sendMessage],
  );

  return {
    requestRoomBooking,
    isRequesting: isSending,
  };
};

/**
 * Retry cancel after HITL failure: send a normal user message so the agent
 * decides whether to call cancel_booking again (never call the tool from UI).
 */
export const useRetryCancelBooking = () => {
  const { sendMessage, isSending } = useSendAgentMessage({
    onError: (error) => {
      console.error("Failed to retry cancel booking", error);
    },
  });

  const retryCancelBooking = useCallback(
    () => sendMessage(getRetryMessage(MODEL_NAME.CANCEL)),
    [sendMessage],
  );

  return { retryCancelBooking, isRetrying: isSending };
};

/**
 * Retry create after HITL failure: send a normal user message so the agent
 * decides whether to call create_booking again (never call the tool from UI).
 */
export const useRetryCreateBooking = () => {
  const { sendMessage, isSending } = useSendAgentMessage({
    onError: (error) => {
      console.error("Failed to retry create booking", error);
    },
  });

  const retryCreateBooking = useCallback(
    () => sendMessage(getRetryMessage(MODEL_NAME.CREATE)),
    [sendMessage],
  );

  return { retryCreateBooking, isRetrying: isSending };
};

/**
 * Retry modify after HITL failure: send a normal user message so the agent
 * decides whether to call update_booking again (never call the tool from UI).
 */
export const useRetryModifyBooking = () => {
  const { sendMessage, isSending } = useSendAgentMessage({
    onError: (error) => {
      console.error("Failed to retry modify booking", error);
    },
  });

  const retryModifyBooking = useCallback(
    () => sendMessage(getRetryMessage(MODEL_NAME.MODIFY)),
    [sendMessage],
  );

  return { retryModifyBooking, isRetrying: isSending };
};
