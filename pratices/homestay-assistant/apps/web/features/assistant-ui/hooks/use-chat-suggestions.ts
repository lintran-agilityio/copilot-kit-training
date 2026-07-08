import { SUGGESTIONS_BY_STATE } from "../constants";
import { ChatSuggestionState } from "../types";
import { useChatSuggestionState } from "./use-chat-suggestion-state";

export const useChatSuggestions = () => {
  const state = useChatSuggestionState();

  return SUGGESTIONS_BY_STATE[state as ChatSuggestionState];
};
