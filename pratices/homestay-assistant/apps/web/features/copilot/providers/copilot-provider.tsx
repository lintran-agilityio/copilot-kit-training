"use client";

import { CopilotContexts } from "../contexts";
import { RoomToolsProvider } from "@/features/room/copilot";

type CopilotProviderProps = {
  children: React.ReactNode;
};

export const CopilotProvider = ({ children }: CopilotProviderProps) => {
  return (
    <>
      <CopilotContexts />
      <RoomToolsProvider />
      {children}
    </>
  )
}
