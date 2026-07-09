import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { ChatSuggestion } from "@/features/assistant-ui/types";
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

    await copilotkit.runAgent({ agent });
  };

  return (
    <div className="flex flex-wrap gap-2 pointer-events-auto m-4">
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
  )
};
