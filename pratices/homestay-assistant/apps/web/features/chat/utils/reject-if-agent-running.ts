import { useChatStore } from "@/features/chat/stores/chat-store";
import { resolveAgentBusyMessage } from "@/features/chat/utils/agent-busy";

/**
 * Blocks a new agent request while a run is in flight and records the
 * guest-facing error. Returns true when the caller must abort.
 */
export const rejectIfAgentRunning = (isRunning: boolean): boolean => {
  const message = resolveAgentBusyMessage(isRunning);
  if (!message) {
    return false;
  }

  useChatStore.getState().setActionError(message);
  return true;
};
