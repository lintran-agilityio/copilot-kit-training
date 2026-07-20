import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { ChatSuggestion } from "@/features/assistant-ui/types";
import { scheduleScrollChatToEnd } from "@/features/assistant-ui/utils";
import { AGENT_KEYS } from "@repo/constants";
import { CopilotSuggestion } from "@/components/suggestions/CopilotSuggestion";

type SuggestionBarProps = {
  suggestions: ChatSuggestion[];
  agentId?: string;
  threadId?: string;
};

export const SuggestionBar = ({
  suggestions,
  agentId = AGENT_KEYS.MANAGE_ASSISTANT,
  threadId,
}: SuggestionBarProps) => {
  const { agent } = useAgent({
    agentId,
  });

  const { copilotkit } = useCopilotKit();

  const handleSuggestionClick = async (prompt: string) => {
    if (threadId) {
      agent.threadId = threadId;
    }

    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    });

    scheduleScrollChatToEnd("auto");

    try {
      await copilotkit.runAgent({ agent });
    } finally {
      scheduleScrollChatToEnd("auto");
    }
  };

  if (!suggestions.length) {
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
