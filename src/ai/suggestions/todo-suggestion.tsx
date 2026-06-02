"use client";

import {
  useConfigureSuggestions,
  useSuggestions
} from "@copilotkit/react-core/v2";

export const useTodoSuggestions = () => {
  useConfigureSuggestions({
    instructions: `
      Suggest productivity todo actions.

      Examples: 
      - Create learning list
      - Add the work should should todo
      - Complete unfinished tasks
      - Organize task by priority
    `,
  });

  return useSuggestions();
};
