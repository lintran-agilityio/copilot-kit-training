"use client";

import { BookingProvider } from "@/features/booking/stores/booking-provider";
import { CopilotProvider } from "@/features/copilot/providers/copilot-provider";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <BookingProvider>
      <CopilotProvider>{children}</CopilotProvider>
    </BookingProvider>
  );
};
