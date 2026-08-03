"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { parseToolResult } from "@repo/utils";
import { RoomListSkeleton } from "@/components/common/RoomListSkeleton";
import { EmbeddedWidget } from "@/features/chat/components";
import { ListRoomPreview } from "@/features/room/components/ListRoomPreview";
import type {
  FindRoomResult,
  FindRoomToolProps,
} from "@/features/room/types";
import { buildFindRoomTitle } from "@/features/room/utils";

/**
 * Renders find_room tool output in chat: skeleton while loading, room cards when done.
 *
 * @param props - CopilotKit tool render status and result
 */
export const FindRoomNotice = ({
  status,
  result,
}: FindRoomToolProps) => {
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

  const parsed = parseToolResult<FindRoomResult>(result);
  const rooms = parsed?.rooms ?? [];

  if (!rooms || !rooms.length) {
    return (
      <EmbeddedWidget className="px-3.5 py-3 text-zinc-400">
        No rooms matched that search.
      </EmbeddedWidget>
    );
  }

  return (
    <EmbeddedWidget unframed>
      <ListRoomPreview rooms={rooms} title={buildFindRoomTitle(parsed ?? {})} />
    </EmbeddedWidget>
  );
};
