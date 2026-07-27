"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { Loading } from "@repo/components";
import { parseToolResult } from "@repo/utils";
import { RoomDetail } from "@/features/room/components/RoomDetail";
import type {
  GetRoomByIdResult,
  GetRoomByIdToolProps,
} from "@/features/room/copilot/types";

export const GetRoomByIdToolRenderer = ({
  status,
  result,
}: GetRoomByIdToolProps) => {
  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <div className="max-w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400">
        <Loading />
      </div>
    );
  }

  if (status !== ToolCallStatus.Complete) {
    return null;
  }

  const parsed = parseToolResult<GetRoomByIdResult>(result);
  const room = parsed?.room;

  if (!room) {
    return null;
  }

  return (
    <RoomDetail
      {...room}
      className="max-w-full border-white/10 bg-white/[0.02] shadow-none"
    />
  );
};
