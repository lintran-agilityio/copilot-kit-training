"use client";

import { useMemo } from "react";
import {
  useAgent,
  useConfigureSuggestions,
  UseAgentUpdate,
} from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";
import { useRoomStore } from "@/features/room/stores/room-store";
import { getPriorityStaticSuggestions } from "@/features/chat/constants";
import { useHomestayAgentContext } from "@/features/chat/hooks/use-homestay-agent-context";

type StaticSuggestionConfigProps = {
  agentId?: string;
};

export const StaticSuggestionConfig = ({
  agentId = AGENT_KEYS.MANAGE_ASSISTANT,
}: StaticSuggestionConfigProps) => {
  const context = useHomestayAgentContext();
  const { agent } = useAgent({
    agentId,
    updates: [UseAgentUpdate.OnRunStatusChanged],
  });
  const focusRoomId = context.focus?.type === "room" ? context.focus.id : null;
  const roomName = useRoomStore((s) =>
    focusRoomId
      ? s.rooms.find((room) => room.id === focusRoomId)?.name
      : undefined,
  );
  const contextKey = useMemo(() => JSON.stringify(context), [context]);

  const staticSuggestions = useMemo(
    () => getPriorityStaticSuggestions(context, roomName),
    // contextKey tracks HomestayAgentContext without thrashing on new object identity
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contextKey is the stable fingerprint
    [contextKey, roomName],
  );

  const config = useMemo(
    () =>
      agent.isRunning
        ? null
        : {
            suggestions: staticSuggestions,
            available: "always" as const,
            consumerAgentId: agentId,
          },
    [agent.isRunning, agentId, staticSuggestions],
  );

  useConfigureSuggestions(config, [
    contextKey,
    roomName,
    agentId,
    agent.isRunning,
  ]);

  return null;
};
