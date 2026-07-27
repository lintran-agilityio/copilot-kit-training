"use client";

import dynamic from "next/dynamic";

import { CopilotContexts } from "@/features/copilot/contexts";
import { AgentMessagesSanitizer } from "@/features/copilot/components/AgentMessagesSanitizer";
import { GlobalToolRendererProvider } from "./global-tool-renderer-provider";

const RoomToolsProvider = dynamic(
  () =>
    import("@/features/copilot/providers/room-tools").then(
      (mod) => mod.RoomToolsProvider,
    ),
  { ssr: false },
);

const BookingToolsProvider = dynamic(
  () =>
    import("@/features/copilot/providers/booking-tools").then(
      (mod) => mod.BookingToolsProvider,
    ),
  { ssr: false },
);

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
