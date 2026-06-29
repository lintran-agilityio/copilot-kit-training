"use client";

import { CopilotContexts } from "../contexts";
import { BookingToolsProvider } from "@/features/booking/copilot";
import { RoomDetailDrawer } from "@/features/room/components/RoomDetailDrawer";
import { RoomToolsProvider } from "@/features/room/copilot";
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
