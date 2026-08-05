"use client";

import { useEffect, useRef } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { parseToolResult } from "@repo/utils";
import { RoomListSkeleton } from "@/components/common/RoomListSkeleton";
import { EmbeddedWidget } from "@/features/chat/components";
import { ListRoomPreview } from "@/features/room/components/ListRoomPreview";
import type {
  FindRoomResult,
  FindRoomToolProps,
} from "@/features/room/types";
import {
  buildFindRoomTitle,
  markAgentRoomSearch,
} from "@/features/room/utils";

/**
 * Renders find_room tool output in chat: skeleton while loading, room cards when done.
 * Results stay inside chat — the page room grid is never mutated from here.
 *
 * @param props - CopilotKit tool render status and result
 */
export const FindRoomNotice = ({
  status,
  result,
}: FindRoomToolProps) => {
  const lastMarkedKeyRef = useRef<string | null>(null);

  const parsed =
    status === ToolCallStatus.Complete
      ? parseToolResult<FindRoomResult>(result)
      : null;
  const rooms = parsed?.rooms ?? [];
  const title = parsed ? buildFindRoomTitle(parsed) : "Room results";
  const roomIdsKey = rooms.map((room) => room.id).join(",");

  useEffect(() => {
    if (status !== ToolCallStatus.Complete || !rooms.length) {
      return;
    }

    const searchKey = `${title}:${roomIdsKey}`;
    if (lastMarkedKeyRef.current === searchKey) {
      return;
    }

    lastMarkedKeyRef.current = searchKey;
    markAgentRoomSearch();
  }, [status, rooms, title, roomIdsKey]);

  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <EmbeddedWidget className="p-3.5">
        <RoomListSkeleton itemCount={3} className="max-w-full" />
      </EmbeddedWidget>
    );
  }

  if (status !== ToolCallStatus.Complete) {
    return null;
  }

  if (!rooms.length) {
    return (
      <EmbeddedWidget className="px-3.5 py-3 text-zinc-400">
        No rooms matched that search.
      </EmbeddedWidget>
    );
  }

  return (
    <EmbeddedWidget unframed>
      <ListRoomPreview rooms={rooms} title={title} />
    </EmbeddedWidget>
  );
};
