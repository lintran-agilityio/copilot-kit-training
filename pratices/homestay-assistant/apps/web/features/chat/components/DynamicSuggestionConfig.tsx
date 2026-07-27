"use client";

import { useMemo } from "react";
import { useConfigureSuggestions } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";
import { useBooking } from "@/features/booking/hooks";
import { useRoomStore } from "@/features/room/stores/room-store";
import { getSuggestionInstructions } from "@/features/chat/constants";
import { useHomestayAgentContext } from "@/features/chat/hooks/use-homestay-agent-context";

type DynamicSuggestionConfigProps = {
  agentId?: string;
};

export const DynamicSuggestionConfig = ({
  agentId = AGENT_KEYS.MANAGE_ASSISTANT,
}: DynamicSuggestionConfigProps) => {
  const context = useHomestayAgentContext();
  const roomId = useBooking((s) => s.roomId);
  const roomName = useRoomStore((s) =>
    roomId ? s.rooms.find((room) => room.id === roomId)?.name : undefined,
  );
  const contextKey = useMemo(
    () => JSON.stringify(context),
    [context],
  );

  const instructions = useMemo(
    () => getSuggestionInstructions(context, roomName),
    // contextKey tracks HomestayAgentContext without thrashing on new object identity
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contextKey is the stable fingerprint
    [contextKey, roomName],
  );

  const config = useMemo(
    () => ({
      instructions,
      minSuggestions: 1,
      maxSuggestions: 3,
      available: "always" as const,
      // Memory-less provider: CopilotKit mints a new threadId per suggestion
      // reload; using manage-assistant here persisted ghost sidebar threads.
      providerAgentId: AGENT_KEYS.SUGGESTION_ASSISTANT,
      consumerAgentId: agentId,
    }),
    [agentId, instructions],
  );

  useConfigureSuggestions(config);

  return null;
};
