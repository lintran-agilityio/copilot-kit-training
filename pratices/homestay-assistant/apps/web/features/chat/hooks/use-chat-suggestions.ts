import { useConfigureSuggestions } from "@copilotkit/react-core/v2";

import { CHAT_SUGGESTIONS } from "../constants";

const DYNAMIC_SUGGESTION_INSTRUCTIONS =
  "Suggest 3 concise follow-up questions about room booking, availability, amenities, or comparing rooms based on the conversation.";

type UseConfigureChatSuggestionsProps = {
  agentId: string;
};

export const useConfigureChatSuggestions = ({
  agentId,
}: UseConfigureChatSuggestionsProps) => {
  useConfigureSuggestions({
    suggestions: CHAT_SUGGESTIONS,
    available: "before-first-message",
    consumerAgentId: agentId,
  });

  useConfigureSuggestions(
    {
      instructions: DYNAMIC_SUGGESTION_INSTRUCTIONS,
      minSuggestions: 2,
      maxSuggestions: 4,
      available: "after-first-message",
      consumerAgentId: agentId,
    },
    [agentId],
  );
};
