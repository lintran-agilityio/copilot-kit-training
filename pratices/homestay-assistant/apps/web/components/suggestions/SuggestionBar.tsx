import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { ChatSuggestion } from "@/features/chat/types";
import { AGENT_KEYS } from "@repo/constants";
import { CopilotSuggestion } from "./CopilotSuggestion";

export const SuggestionBar = ({ suggestions }: { suggestions: ChatSuggestion[] }) => {
  const { agent } = useAgent({
    agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
  });

  const { copilotkit } = useCopilotKit();

  const handleSuggestionClick = async (prompt: string) => {
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
