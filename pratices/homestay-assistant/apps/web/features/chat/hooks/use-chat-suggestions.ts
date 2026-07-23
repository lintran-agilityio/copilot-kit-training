import { useMemo } from "react";
import { useSuggestions } from "@copilotkit/react-core/v2";

import { ChatSuggestion } from "@/features/chat/types";
import { normalize } from "@/features/chat/utils";

type UseChatSuggestionsOptions = {
  agentId: string;
};

export const useChatSuggestions = ({
  agentId,
}: UseChatSuggestionsOptions): ChatSuggestion[] => {
  const { suggestions } = useSuggestions({ agentId });

  return useMemo(() => {
    const seen = new Set<string>();
    return suggestions.reduce<ChatSuggestion[]>(
      (result, suggestion) => {
        const title = suggestion.title?.trim();
        const message = suggestion.message?.trim();

        if (!title || !message) {
          return result;
        }

        // UI-level deduplication:
        // same visible action = same suggestion.
        const key = normalize(title);

        if (seen.has(key)) {
          return result;
        }

        seen.add(key);

        result.push({
          id: key,
          label: title,
          prompt: message,
        });

        return result;
      },
      [],
    );
  }, [suggestions]);
};
