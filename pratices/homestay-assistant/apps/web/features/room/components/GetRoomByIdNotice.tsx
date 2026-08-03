"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { EmbeddedWidget } from "@/features/chat/components";
import { RoomDetail } from "@/features/room/components";
import type {
  GetRoomByIdResult,
  GetRoomByIdToolProps,
} from "@/features/room/types";
import { Loading } from "@repo/components";
import { parseToolResult } from "@repo/utils";

export const GetRoomByIdNotice = ({
  status,
  result,
}: GetRoomByIdToolProps) => {
  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <EmbeddedWidget className="px-4 py-6 text-zinc-400">
        <Loading />
      </EmbeddedWidget>
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
    <EmbeddedWidget unframed>
      <RoomDetail
        {...room}
        variant="chat-booking"
        className="w-full border-white/12 bg-[#111111] shadow-none"
      />
    </EmbeddedWidget>
  );
};
