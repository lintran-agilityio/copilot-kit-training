"use client";

import { CopilotProvider } from "@/features/copilot/providers/copilot-provider";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <CopilotProvider>
      {children}
    </CopilotProvider>
  )
}
