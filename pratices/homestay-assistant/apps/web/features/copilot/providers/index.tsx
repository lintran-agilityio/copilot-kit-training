"use client";

import { CopilotContexts } from "@/features/copilot/contexts";
import { AgentMessagesSanitizer } from "@/features/copilot/components";
import { BookingToolsProvider } from "@/features/copilot/providers/booking-tools";
import { RoomToolsProvider } from "@/features/copilot/providers/room-tools";
import { GlobalToolRendererProvider } from "./global-tool-renderer-provider";

type CopilotProviderProps = {
  children: React.ReactNode;
};

export const CopilotProvider = ({ children }: CopilotProviderProps) => {
  return (
    <>
      <CopilotContexts />
      <AgentMessagesSanitizer />
      <GlobalToolRendererProvider />
      <RoomToolsProvider />
      <BookingToolsProvider />
      {children}
    </>
  );
};
