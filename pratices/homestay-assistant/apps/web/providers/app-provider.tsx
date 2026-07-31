"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CopilotProvider } from "@/features/copilot/providers";
import { DynamicSuggestionConfig } from "@/features/chat/components";
import { HomestayReadable } from "@/features/copilot/readable";

type AppProviderProps = {
  children: React.ReactNode;
  /** Copilot hooks require CopilotKit; keep false on login / pre-auth shells. */
  withCopilot?: boolean;
};

export const AppProvider = ({
  children,
  withCopilot = true,
}: AppProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {withCopilot ? (
        <CopilotProvider>
          <HomestayReadable />
          <DynamicSuggestionConfig />
          {children}
        </CopilotProvider>
      ) : (
        children
      )}
    </QueryClientProvider>
  );
};
