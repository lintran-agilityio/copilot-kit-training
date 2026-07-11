"use client";

import { CopilotContexts } from "@/features/ai-elements/providers/copilot-context";
import { BookingToolsProvider, RoomToolsProvider } from "@/features/ai-elements/tools";
import { RoomDetailModal } from "@/features/ai-elements/components";
import { AgentMessagesSanitizer } from "@/features/ai-elements/components";

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
      <RoomDetailModal />
      {children}
    </>
  )
}
