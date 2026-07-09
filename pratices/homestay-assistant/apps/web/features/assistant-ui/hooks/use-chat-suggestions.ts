import { SUGGESTIONS_BY_STATE } from "@/features/assistant-ui/constants";
import { ChatSuggestionState } from "@/features/assistant-ui/types";
import { useChatSuggestionState } from "@/features/assistant-ui/hooks/use-chat-suggestion-state";

export const useChatSuggestions = () => {
  const state = useChatSuggestionState();

  return SUGGESTIONS_BY_STATE[state as ChatSuggestionState];
};
