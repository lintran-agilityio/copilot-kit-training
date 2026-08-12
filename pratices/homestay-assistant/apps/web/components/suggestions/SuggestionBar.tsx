import {
  useAgent,
  useCopilotKit,
  UseAgentUpdate,
} from "@copilotkit/react-core/v2";
import {
  AGENT_KEYS,
  getBookingFormDisplayText,
  isBookingFormPrompt,
  parseBookingFormRoomId,
} from "@repo/constants";

import { CopilotSuggestion } from "@/components/suggestions/CopilotSuggestion";
import { prepareBookingFormMessage } from "@/features/booking/utils/prepare-booking-form-message";
import { ChatSuggestion } from "@/features/chat/types";
import { scheduleScrollChatToEnd } from "@/features/chat/utils";
import { runAgentSafely } from "@/features/chat/utils/agent-run";
import { rejectIfAgentRunning } from "@/features/chat/utils/reject-if-agent-running";

type SuggestionBarProps = {
  suggestions: ChatSuggestion[];
  agentId?: string;
  threadId?: string;
};

const resolveOutboundPrompt = (prompt: string) => {
  if (!isBookingFormPrompt(prompt)) {
    return prompt;
  }

  const roomId = parseBookingFormRoomId(prompt);
  if (!roomId) {
    return prompt;
  }

  const display = getBookingFormDisplayText(prompt);
  const roomName = display.startsWith("Book ")
    ? display.slice("Book ".length).trim()
    : "this room";

  return prepareBookingFormMessage(roomId, roomName).message;
};

export const SuggestionBar = ({
  suggestions,
  agentId = AGENT_KEYS.MANAGE_ASSISTANT,
  threadId,
}: SuggestionBarProps) => {
  const { agent } = useAgent({
    agentId,
    updates: [UseAgentUpdate.OnRunStatusChanged],
  });

  const { copilotkit } = useCopilotKit();

  const handleSuggestionClick = async (prompt: string) => {
    if (rejectIfAgentRunning(agent.isRunning)) {
      return;
    }

    if (threadId) {
      agent.threadId = threadId;
    }

    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: resolveOutboundPrompt(prompt),
    });

    scheduleScrollChatToEnd("auto");

    try {
      await runAgentSafely(() => copilotkit.runAgent({ agent }));
    } finally {
      scheduleScrollChatToEnd("auto");
    }
  };

  if (agent.isRunning || !suggestions.length) {
    return null;
  }

  return (
    <div className="pointer-events-auto flex flex-wrap gap-2 px-4 pb-2 pt-3">
      {suggestions.map((suggestion) => (
        <CopilotSuggestion
          key={suggestion.id}
          type="button"
          onClick={() => handleSuggestionClick(suggestion.prompt)}
        >
          {suggestion.label}
        </CopilotSuggestion>
      ))}
    </div>
  );
};
