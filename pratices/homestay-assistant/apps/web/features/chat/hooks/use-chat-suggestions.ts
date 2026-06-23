import { useConfigureSuggestions } from "@copilotkit/react-core/v2";

import { CHAT_SUGGESTIONS } from "../constants";

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
};
