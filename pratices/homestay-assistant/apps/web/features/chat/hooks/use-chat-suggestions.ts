import { SUGGESTIONS_BY_STATE } from "../constants";
import { useChatSuggestionState } from "./use-chat-suggestion-state";

export const useChatSuggestions = () => {
  const state = useChatSuggestionState();

  return SUGGESTIONS_BY_STATE[state];
};
