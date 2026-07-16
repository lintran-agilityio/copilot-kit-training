"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BookingProvider } from "@/features/booking/stores/booking-provider";
import { CopilotProvider } from "@/features/ai-elements/providers/copilot-provider";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BookingProvider>
        <CopilotProvider>{children}</CopilotProvider>
      </BookingProvider>
    </QueryClientProvider>
  );
};
