"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CopilotProvider } from "@/features/copilot/providers";
import {
  DynamicSuggestionConfig,
  HomestayAgentContext,
} from "@/features/chat/components";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CopilotProvider>
        <HomestayAgentContext />
        <DynamicSuggestionConfig />
        {children}
      </CopilotProvider>
    </QueryClientProvider>
  );
};
