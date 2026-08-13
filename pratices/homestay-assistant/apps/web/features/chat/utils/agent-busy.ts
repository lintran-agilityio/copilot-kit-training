import { AGENT_BUSY_MESSAGE } from "../constants/messages";

type ChatSendKeyDown = {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  isRunning: boolean;
};

export const resolveAgentBusyMessage = (
  isRunning: boolean,
): string | null => (isRunning ? AGENT_BUSY_MESSAGE : null);

/** True when Enter would submit chat while the agent is already running. */
export const shouldBlockChatSendKeyDown = ({
  key,
  shiftKey,
  isComposing,
  isRunning,
}: ChatSendKeyDown): boolean => {
  if (!isRunning || isComposing || shiftKey) {
    return false;
  }

  return key === "Enter";
};
