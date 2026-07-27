"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { parseToolResult } from "@repo/utils";
import { RoomListSkeleton } from "@/components/common/RoomListSkeleton";
import { ListRoomPreview } from "@/features/room/components/ListRoomPreview";
import type {
  FindRoomResult,
  FindRoomToolProps,
} from "@/features/room/copilot/types";
import { buildFindRoomTitle } from "@/features/room/copilot/utils";

/**
 * Renders find_room tool output in chat: skeleton while loading, room cards when done.
 *
 * @param props - CopilotKit tool render status and result
 */
export const FindRoomToolRenderer = ({
  status,
  result,
}: FindRoomToolProps) => {
  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <RoomListSkeleton
        itemCount={3}
        className="max-w-full rounded-2xl border border-white/8 bg-white/[0.02] p-4"
      />
    );
  }

  if (status !== ToolCallStatus.Complete) {
    return null;
  }

  const parsed = parseToolResult<FindRoomResult>(result);
  const rooms = parsed?.rooms ?? [];

  if (!rooms || !rooms.length) {
    return (
      <div className="max-w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
        No rooms matched that search.
      </div>
    );
  }

  return (
    <ListRoomPreview rooms={rooms} title={buildFindRoomTitle(parsed ?? {})} />
  );
};
