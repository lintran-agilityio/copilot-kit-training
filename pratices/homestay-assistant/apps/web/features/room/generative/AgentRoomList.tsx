"use client";

import { useEffect, useState } from "react";
import { useRenderToolCall } from "@copilotkit/react-core/v2";

import { TOOL_KEYS } from "@repo/constants";
import { Loading } from "@repo/components";
import { fetchRooms } from "../services";
import { RoomLoadMode } from "../types/room";
import {
  getPageRoomsToolCall,
  setPageRoomsToolCall,
  type PageRoomsToolCall,
} from "./page-rooms-cache";

const buildRenderRoomsToolCall = (
  loadKey: string,
  roomIds: string[]
): PageRoomsToolCall => ({
  id: `page-rooms-${loadKey}`,
  type: "function",
  function: {
    name: TOOL_KEYS.RENDER_ROOMS,
    arguments: JSON.stringify({ roomIds }),
  },
});

type AgentRoomListProps = {
  mode?: RoomLoadMode;
  selectedDate?: string;
  className?: string;
};

export const AgentRoomList = ({
  mode = RoomLoadMode.ALL,
  selectedDate,
  className,
}: AgentRoomListProps) => {
  const renderToolCall = useRenderToolCall();
  const loadKey = mode === RoomLoadMode.ALL ? "all" : selectedDate;
  const [renderRoomsToolCall, setRenderRoomsToolCall] = useState(
    () => (loadKey ? getPageRoomsToolCall(loadKey) : null) ?? null
  );
  const [isLoading, setIsLoading] = useState(() => !renderRoomsToolCall);

  useEffect(() => {
    if (!loadKey) {
      return;
    }

    const cachedToolCall = getPageRoomsToolCall(loadKey);
    if (cachedToolCall) {
      setRenderRoomsToolCall(cachedToolCall);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadRooms = async () => {
      setIsLoading(true);

      try {
        const rooms = await fetchRooms({
          date: mode === RoomLoadMode.ALL ? undefined : selectedDate,
          signal: controller.signal,
        });
        const toolCall = buildRenderRoomsToolCall(
          loadKey,
          rooms.map((room) => room.id),
        );

        setPageRoomsToolCall(loadKey, toolCall);
        setRenderRoomsToolCall(toolCall);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load rooms", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();

    return () => controller.abort();
  }, [loadKey, mode, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!renderRoomsToolCall) {
    return null;
  }

  return (
    <div className={className}>
      {renderToolCall({ toolCall: renderRoomsToolCall })}
    </div>
  );
};
