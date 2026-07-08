"use client";

import { CopilotContexts } from "./copilot-context";
import { BookingToolsProvider, RoomToolsProvider } from "../tools";
import { RoomDetailDrawer } from "../components";
import { AgentMessagesSanitizer } from "../components";

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
      <RoomDetailDrawer />
      {children}
    </>
  )
}
