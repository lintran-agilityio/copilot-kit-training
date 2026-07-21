"use client";

import { CopilotContexts } from "@/features/copilot/contexts";
import { AgentMessagesSanitizer } from "@/features/copilot/components";
import { BookingToolsProvider } from "@/features/copilot/providers/booking-tools";
import { RoomToolsProvider } from "@/features/copilot/providers/room-tools";

type CopilotProviderProps = {
  children: React.ReactNode;
};

export const CopilotProvider = ({ children }: CopilotProviderProps) => {
  return (
    <>
      <CopilotContexts />
      <AgentMessagesSanitizer />
      <RoomToolsProvider />
      <BookingToolsProvider />
      {children}
    </>
  );
};
