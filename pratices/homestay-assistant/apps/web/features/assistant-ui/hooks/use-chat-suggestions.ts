import { useMemo } from "react";

import { buildActionPrompt } from "@repo/utils";
import { useBooking } from "@/features/booking/hooks";
import { SUGGESTIONS_BY_STATE } from "@/features/assistant-ui/constants";
import {
  ChatSuggestion,
  ChatSuggestionState,
} from "@/features/assistant-ui/types";
import { useChatSuggestionState } from "@/features/assistant-ui/hooks/use-chat-suggestion-state";

export const useChatSuggestions = (): ChatSuggestion[] => {
  const state = useChatSuggestionState();
  const selectedRoom = useBooking((s) => s.selectedRoom);

  return useMemo(() => {
    const baseSuggestions = SUGGESTIONS_BY_STATE[state as ChatSuggestionState];

    if (state !== ChatSuggestionState.ROOM_DETAIL || !selectedRoom) {
      return baseSuggestions;
    }

    return baseSuggestions.map((suggestion) => {
      if (suggestion.id !== "book-room") {
        return suggestion;
      }

      return {
        ...suggestion,
        prompt: buildActionPrompt({
          action: "Book",
          targetName: selectedRoom.name,
          identifiers: { roomId: selectedRoom.id },
        }),
      };
    });
  }, [selectedRoom, state]);
};
