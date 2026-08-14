"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";

import { useUser } from "@clerk/nextjs";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import {
  AGENT_KEYS,
  HOMESTAY_AGENT_TASK_STATUS,
  HOMESTAY_AGENT_TASK_TYPE,
} from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { ROUTES } from "@/constants";
import { prepareBookingFormMessage } from "@/features/booking/utils/prepare-booking-form-message";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import { runAgentSafely } from "@/features/chat/utils/agent-run";
import { rejectIfAgentRunning } from "@/features/chat/utils/reject-if-agent-running";
import { ROOM_DETAIL_ENTRY_MODE } from "@/features/room/constants/room-detail";
import { useRoomStore } from "@/features/room/stores/room-store";
import { useThreadStore } from "@/features/threads/store/thread-store";

const BOOK_FLOW_KEY = "book-flow";

type RequestRoomBookingFormArgs = {
  roomId: string;
  roomName: string;
  /**
   * Whether to also open the room detail on the home page. Page room cards
   * keep this on; chat cards turn it off so booking stays inside chat.
   */
  openOnPage?: boolean;
};

export const useRequestRoomBookingForm = () => {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const activeThreadIds = useThreadStore((state) => state.activeThreadIds);
  const createDraftThread = useThreadStore((state) => state.createDraftThread);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  return useCallback(
    ({
      roomId,
      roomName,
      openOnPage = true,
    }: RequestRoomBookingFormArgs) => {
      if (!isLoaded || !user?.id || !roomId) {
        return;
      }

      if (rejectIfAgentRunning(agent.isRunning)) {
        return;
      }

      useBookingStore.getState().updateBookingDraft({
        roomId,
        checkInDate: null,
        checkOutDate: null,
        guests: 1,
      });
      useHomestayAgentUiStore.getState().pushFocusedRoom(roomId);
      useHomestayAgentUiStore.getState().pushUiFocus({
        key: BOOK_FLOW_KEY,
        task: {
          type: HOMESTAY_AGENT_TASK_TYPE.BOOK,
          status: HOMESTAY_AGENT_TASK_STATUS.IN_PROGRESS,
        },
        focus: { type: "room", id: roomId },
      });

      if (openOnPage && pathname === ROUTES.HOME) {
        useRoomStore
          .getState()
          .setSelectedRoomId(roomId, ROOM_DETAIL_ENTRY_MODE.BOOK);
      }

      const scopeKey = getAgentResourceId(user.id, AGENT_KEYS.HOMESTAY_ASSISTANT);
      const threadId =
        activeThreadIds[scopeKey] ?? createDraftThread(scopeKey);
      const { message } = prepareBookingFormMessage(roomId, roomName);

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
            console.error("Failed to open room booking form in chat", error);
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
      pathname,
      user?.id,
      setPendingOutboundMessage,
    ],
  );
};
