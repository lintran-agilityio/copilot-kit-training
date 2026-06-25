"use client";

import { CopilotContexts } from "../contexts";
import { RoomDetailDrawer } from "@/features/room/components/RoomDetailDrawer";
import { RoomToolsProvider } from "@/features/room/copilot";

type CopilotProviderProps = {
  children: React.ReactNode;
};

export const CopilotProvider = ({ children }: CopilotProviderProps) => {
  return (
    <>
      <CopilotContexts />
      <RoomToolsProvider />
      <RoomDetailDrawer />
      {children}
    </>
  )
}
